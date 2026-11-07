/** Étiquette « envoyé par » d'un message sortant d'entreprise (logique pure). */
import type {Message} from '../../../core/realtime/events';

/**
 * - message entrant, ou espace sans équipe : rien
 * - `sent_by` absent (message antérieur à la v16.1) : rien — ne pas le confondre avec `null`
 * - `sent_by` null : auteur supprimé (compte invité parti)
 */
export function senderLabel(
  message: Pick<Message, 'direction' | 'sent_by'>,
  selfId: string | null,
  isTeam: boolean,
): string | null {
  if (!isTeam || message.direction !== 'out') return null;
  if (message.sent_by === undefined) return null;
  if (message.sent_by === null) return 'Ancien membre';
  if (selfId && message.sent_by.id === selfId) return 'Vous';
  return message.sent_by.display_name || 'Membre';
}
