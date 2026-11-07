/** Logique pure du tableau de bord entreprise (sans React). */
import type {WorkspaceRole} from '../../../core/api/endpoints/workspaces';

/** Initiales (2 lettres au plus) du nom de l'entreprise ou de la personne. */
export function monogram(name: string | null | undefined): string {
  const words = (name ?? '').trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return '·';
  const first = words[0] ?? '';
  const second = words[1] ?? '';
  const letters =
    words.length === 1 ? first.slice(0, 2) : first.charAt(0) + second.charAt(0);
  return letters.toUpperCase();
}

export function roleTag(role: WorkspaceRole): string {
  if (role === 'owner') return 'Propriétaire';
  if (role === 'agent') return 'Agent';
  return 'Lecteur';
}

export type QuotaLevel = 'unknown' | 'ok' | 'warn' | 'bad';

/** Vert sous 65 %, orange dès 65 %, rouge dès 90 % (mêmes seuils que le tableau Botgram). */
export function quotaLevel(used: number | null, limit: number | null): QuotaLevel {
  if (used === null || limit === null || limit <= 0) return 'unknown';
  const pct = (used / limit) * 100;
  if (pct >= 90) return 'bad';
  if (pct >= 65) return 'warn';
  return 'ok';
}

/** Nombre de segments allumés sur `total` ; au moins 1 dès qu'il y a un envoi. */
export function quotaSegments(
  used: number | null,
  limit: number | null,
  total = 24,
): number {
  if (used === null || limit === null || limit <= 0 || used <= 0) return 0;
  const lit = Math.round((Math.min(used, limit) / limit) * total);
  return Math.max(1, Math.min(total, lit));
}

/** Heure locale « HH:MM » d'un horodatage en millisecondes. */
export function clockLabel(ms: number | null | undefined): string {
  if (typeof ms !== 'number' || !Number.isFinite(ms)) return '';
  const d = new Date(ms);
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h}:${m}`;
}

export type BotState = 'online' | 'attention' | 'offline';

/** Connecté / à surveiller (webhook ou jeton) / déconnecté. */
export function botState(status: string): BotState {
  if (status === 'connected') return 'online';
  if (status === 'webhook_error' || status === 'token_invalid') {
    return 'attention';
  }
  return 'offline';
}

export function botStateLabel(status: string): string {
  const s = botState(status);
  if (s === 'online') return 'En ligne';
  if (s === 'attention') {
    return status === 'token_invalid' ? 'Jeton invalide' : 'Webhook en erreur';
  }
  return 'Déconnecté';
}

/** Barre de remplissage de l'équipe : 10 personnes au plus. */
export const TEAM_MAX = 10;

export function teamFill(count: number): number {
  if (!Number.isFinite(count) || count <= 0) return 0;
  return Math.min(1, count / TEAM_MAX);
}
