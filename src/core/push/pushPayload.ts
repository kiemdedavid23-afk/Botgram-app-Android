/**
 * Données d'une notification push reçue (PUSH.md) : `type`, `bot_id`,
 * `conversation_id`. Pur : aucune dépendance native.
 */
export type PushKind = 'message' | 'app_update' | 'other';

export type PushPayload = {
  kind: PushKind;
  botId: string | null;
  conversationId: string | null;
};

const str = (v: unknown): string | null =>
  typeof v === 'string' && v.length > 0 ? v : null;

export const APP_UPDATE_TYPE = 'app_update';

export function parsePushData(data: unknown): PushPayload {
  const d =
    data != null && typeof data === 'object'
      ? (data as Record<string, unknown>)
      : {};
  const botId = str(d.bot_id);
  const conversationId = str(d.conversation_id);
  const type = str(d.type);
  let kind: PushKind = 'other';
  if (type === APP_UPDATE_TYPE) kind = 'app_update';
  else if (conversationId) kind = 'message';
  return {kind, botId, conversationId};
}

/** Topic FCM des mises à jour de l'application (contrat 5.7). */
export function updatesTopic(channel: string): string {
  return `app-update-android-${channel}`;
}
