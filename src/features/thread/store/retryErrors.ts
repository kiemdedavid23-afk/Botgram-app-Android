import type {Message} from '../../../core/realtime/events';
import {threadTexts} from '../texts';

export type RetryFailRes = {
  ok: false;
  status: number;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
};

type SetFn = (
  p:
    | Partial<{items: Message[]; sendError: string | null}>
    | ((s: {items: Message[]}) => Partial<{
        items: Message[];
        sendError: string | null;
      }>),
) => void;

export function applyRetryFailure(
  messageId: string,
  res: RetryFailRes,
  set: SetFn,
): void {
  const code = res.error.code;
  const details = res.error.details ?? {};

  if (code === 'RETRY_TOO_EARLY') {
    const retryAt =
      typeof details.retry_at === 'number'
        ? details.retry_at
        : Date.now() + 5000;
    const waitS = Math.max(1, Math.ceil((retryAt - Date.now()) / 1000));
    set(s => ({
      items: s.items.map(m =>
        m.id === messageId ? {...m, retry_at: retryAt, retryable: true} : m,
      ),
      sendError: threadTexts.retryTooEarly(waitS),
    }));
    return;
  }

  if (code === 'MESSAGE_NOT_RETRYABLE') {
    const st =
      typeof details.status === 'string' ? details.status : 'failed';
    set(s => ({
      items: s.items.map(m =>
        m.id === messageId
          ? {...m, status: st, retryable: false, retry_at: null}
          : m,
      ),
      sendError: notRetryableText(st),
    }));
    return;
  }

  if (code === 'BOT_DISCONNECTED') {
    set({sendError: threadTexts.errorBotDisconnected});
    return;
  }

  if (res.status === 404) {
    set(s => ({
      items: s.items.filter(m => m.id !== messageId),
      sendError: threadTexts.notFound,
    }));
    return;
  }

  set({sendError: threadTexts.errorGeneric});
}

function notRetryableText(status: string): string {
  if (status === 'unknown') return threadTexts.notRetryableUnknown;
  if (status === 'sending') return threadTexts.notRetryableSending;
  return threadTexts.notRetryableFailed;
}

/** Fenêtre de dédup local failed réseau vs sortant serveur (ms). */
const LOCAL_DEDUP_MS = 120_000;

export function dropLocalNetworkDupes(
  items: Message[],
  now = Date.now(),
): Message[] {
  const serverOut = items.filter(
    m =>
      m.direction === 'out' &&
      !m.id.startsWith('local:') &&
      m.status !== 'failed',
  );
  return items.filter(m => {
    if (
      !(
        m.id.startsWith('local:') &&
        m.status === 'failed' &&
        m.error_code === 'local_network'
      )
    ) {
      return true;
    }
    const localTs = m.created_at ?? 0;
    return !serverOut.some(s => {
      const sTs = s.created_at ?? s.sent_at ?? 0;
      return (
        (s.text ?? '') === (m.text ?? '') &&
        Math.abs(sTs - localTs) <= LOCAL_DEDUP_MS
      );
    });
  });
}
