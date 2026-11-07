/**
 * Actions message L6d — suppression sortante + tombstone archive (6bis-c).
 */
import {getRights} from '../../../core/access/rights';
import {deleteMessage} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import {archiveTombstone} from '../../../core/archive/hydrate';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {threadTexts} from '../texts';
import type {ThreadSlice} from './sendActions';

type Ctx = {
  get: () => ThreadSlice & {items: Message[]};
  set: (
    p:
      | Partial<{items: Message[]; sendError: string | null}>
      | ((s: ThreadSlice & {items: Message[]}) => Partial<{
          items: Message[];
          sendError: string | null;
        }>),
  ) => void;
};

/** Supprime le fichier média local du message (sans effet si aucun). */
function dropLocalMedia(messageId: string): void {
  fireAndForget(getMediaStorage().delete(messageId));
}

/** Retrait local du fil + tombstone archive (13.11) + fichier média local. */
export function removeMessageLocally(
  items: Message[],
  messageId: string,
): Message[] {
  fireAndForget(
    archiveTombstone('message', messageId, 'user_deleted'),
  );
  dropLocalMedia(messageId);
  return items.filter(m => m.id !== messageId);
}

/** Retrait suite événement serveur deleted (sans repasser user_deleted). */
export function removeMessageFromEvent(
  items: Message[],
  messageId: string,
): Message[] {
  fireAndForget(
    archiveTombstone('message', messageId, 'message_deleted'),
  );
  dropLocalMedia(messageId);
  return items.filter(m => m.id !== messageId);
}

export async function doDeleteOutgoing(
  message: Message,
  ctx: Ctx,
): Promise<void> {
  if (message.direction !== 'out' || !getRights().canWrite) return;

  if (message.id.startsWith('local:')) {
    ctx.set(s => ({
      items: removeMessageLocally(s.items, message.id),
      sendError: null,
    }));
    return;
  }

  const res = await deleteMessage(message.id);
  if (
    ctx.get().conversationId &&
    message.conversation_id !== ctx.get().conversationId
  ) {
    return;
  }

  if (!res.ok) {
    const code = res.error.code;
    let err = threadTexts.errorGeneric;
    if (code === 'MESSAGE_TOO_OLD') err = threadTexts.deleteTooOld;
    else if (code === 'MESSAGE_NOT_DELETABLE') err = threadTexts.deleteNotAllowed;
    else if (res.status === 404) err = threadTexts.deleteNotFound;
    else if (code === 'TELEGRAM_ERROR' || res.status === 502) {
      err = threadTexts.deleteTelegramError;
    } else if (res.status === 0) err = threadTexts.errorNetwork;
    ctx.set({sendError: err});
    return;
  }

  if (res.data.deleted) {
    ctx.set(s => ({
      items: removeMessageLocally(s.items, message.id),
      sendError: null,
    }));
  }
}
