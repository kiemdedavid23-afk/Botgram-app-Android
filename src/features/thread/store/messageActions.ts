/**
 * Actions message L6d — suppression sortante.
 * removeMessageLocally : branche pour archive 6 bis.
 */
import {deleteMessage} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
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

/** Retrait local du fil (et futur archive). */
export function removeMessageLocally(
  items: Message[],
  messageId: string,
): Message[] {
  return items.filter(m => m.id !== messageId);
}

export async function doDeleteOutgoing(
  message: Message,
  ctx: Ctx,
): Promise<void> {
  if (message.direction !== 'out') return;

  // local: never sent → retrait local uniquement
  if (message.id.startsWith('local:')) {
    ctx.set(s => ({
      items: removeMessageLocally(s.items, message.id),
      sendError: null,
    }));
    return;
  }

  // failed déjà côté serveur : DELETE peut encore s'appliquer ; tentative réseau
  const res = await deleteMessage(message.id);
  if (ctx.get().conversationId && message.conversation_id !== ctx.get().conversationId) {
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
