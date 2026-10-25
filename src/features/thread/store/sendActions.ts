/**
 * Envoi / retry / marquer lu (L5d) — actions hors create() pour R9.
 */
import {
  sendMessage,
  retryMessage,
  markConversationRead,
} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import {uuidV4} from '../../../core/utils/uuid';
import {mergeMessages} from './mergeMessages';
import {threadTexts} from '../texts';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {useConversationsStore} from '../../conversations/store/conversationsStore';
import {
  applyRetryFailure,
  dropLocalNetworkDupes,
  asDetails,
} from './retryErrors';

export type ThreadSlice = {
  conversationId: string | null;
  items: Message[];
  offline: boolean;
  sending: boolean;
  sendError: string | null;
  lastReadMarked: boolean;
};

type SetGet = {
  get: () => ThreadSlice;
  set: (
    p:
      | Partial<ThreadSlice>
      | ((s: ThreadSlice) => Partial<ThreadSlice>),
  ) => void;
};

function optimisticMessage(
  conversationId: string,
  text: string,
  clientId: string,
): Message {
  return {
    id: `local:${clientId}`,
    conversation_id: conversationId,
    direction: 'out',
    kind: 'text',
    text,
    status: 'sending',
    client_message_id: clientId,
    created_at: Date.now(),
  };
}

/** Fusionne par id OU client_message_id (évite doublon optimiste). */
export function upsertOutgoing(
  items: Message[],
  incoming: Message,
): Message[] {
  const byClient = incoming.client_message_id;
  const filtered = items.filter(m => {
    if (m.id === incoming.id) return false;
    if (byClient && m.client_message_id === byClient) return false;
    if (byClient && m.id === `local:${byClient}`) return false;
    return true;
  });
  return mergeMessages(filtered, [incoming]);
}

export {dropLocalNetworkDupes};

export async function doSend(
  text: string,
  existingClientId: string | undefined,
  ctx: SetGet,
): Promise<void> {
  const {conversationId, offline} = ctx.get();
  if (!conversationId || offline) return;
  const trimmed = text.trim();
  if (!trimmed || trimmed.length > tm.maxMessageLength) return;

  const clientId = existingClientId ?? uuidV4();
  const optimistic = optimisticMessage(conversationId, trimmed, clientId);
  ctx.set(s => ({
    items: upsertOutgoing(s.items, optimistic),
    sending: true,
    sendError: null,
  }));

  const res = await sendMessage(conversationId, {
    text: trimmed,
    client_message_id: clientId,
  });

  if (ctx.get().conversationId !== conversationId) return;

  if (!res.ok) {
    const failed = applySendError(optimistic, res.status, res.error.code);
    ctx.set(s => ({
      items: upsertOutgoing(s.items, failed),
      sending: false,
      sendError: mapSendError(res.error.code, res.status),
    }));
    return;
  }

  const serverMsg = {
    ...res.data.message,
    client_message_id: res.data.message.client_message_id ?? clientId,
  };
  ctx.set(s => ({
    items: dropLocalNetworkDupes(upsertOutgoing(s.items, serverMsg)),
    sending: false,
    sendError: null,
  }));
}

function applySendError(
  base: Message,
  status: number,
  code: string,
): Message {
  return {
    ...base,
    status: 'failed',
    error_code: status === 0 ? 'local_network' : code,
    retryable: false,
  };
}

function mapSendError(code: string, status: number): string {
  if (status === 0) return threadTexts.errorNetwork;
  if (code === 'QUOTA_EXCEEDED') return threadTexts.errorQuota;
  if (code === 'RATE_LIMITED') return threadTexts.errorRateLimited;
  if (code === 'BOT_DISCONNECTED') return threadTexts.errorBotDisconnected;
  if (code === 'VALIDATION_ERROR') return threadTexts.errorValidation;
  return threadTexts.errorGeneric;
}

export async function doRetry(
  messageId: string,
  ctx: SetGet,
): Promise<void> {
  const {conversationId} = ctx.get();
  if (!conversationId) return;
  const current = ctx.get().items.find(m => m.id === messageId);
  if (!current?.retryable) return;
  if (current.retry_at && current.retry_at > Date.now()) return;

  const res = await retryMessage(messageId);
  if (ctx.get().conversationId !== conversationId) return;
  if (!res.ok) {
    applyRetryFailure(
      messageId,
      {
        ok: false,
        status: res.status,
        error: {
          code: res.error.code,
          message: res.error.message,
          details: asDetails(res.error.details),
        },
      },
      ctx.set,
    );
    return;
  }
  if (res.data.retried === false) {
    ctx.set(s => ({
      items: upsertOutgoing(s.items, {
        ...res.data.message,
        status: 'sent',
        retryable: false,
      }),
      sendError: null,
    }));
    return;
  }
  ctx.set(s => ({
    items: upsertOutgoing(s.items, res.data.message),
    sendError: null,
  }));
}

export async function doResendAsNew(
  message: Message,
  ctx: SetGet,
): Promise<void> {
  if (message.kind !== 'text') return;
  if (!message.text) return;
  await doSend(message.text, undefined, ctx);
}

export async function doResendSameId(
  message: Message,
  ctx: SetGet,
): Promise<void> {
  if (message.kind !== 'text') return;
  if (!message.text || !message.client_message_id) return;
  await doSend(message.text, message.client_message_id, ctx);
}

export async function doMarkRead(ctx: SetGet): Promise<void> {
  const {conversationId, offline, lastReadMarked} = ctx.get();
  if (!conversationId || offline || lastReadMarked) return;

  const row = useConversationsStore
    .getState()
    .items.find(i => i.id === conversationId);
  if (row && (row.unread_count ?? 0) === 0) {
    ctx.set({lastReadMarked: true});
    return;
  }

  const res = await markConversationRead(conversationId);
  if (ctx.get().conversationId !== conversationId) return;
  if (!res.ok) return;

  ctx.set({lastReadMarked: true});
  useConversationsStore.getState().applyRealtimeEvent({
    type: 'conversation.read',
    id: `local-read-${conversationId}`,
    at: Date.now(),
    conversation_id: conversationId,
  });
}
