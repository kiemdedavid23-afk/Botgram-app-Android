/**
 * Logique pure du tableau de bord (testable, sans RN).
 */
import type {Bot} from '../../core/api/endpoints/bots';

const MONTHS_FR = [
  'janvier',
  'février',
  'mars',
  'avril',
  'mai',
  'juin',
  'juillet',
  'août',
  'septembre',
  'octobre',
  'novembre',
  'décembre',
] as const;

/** Bonjour si 5 ≤ h < 18, sinon Bonsoir. */
export function greetingWord(hour: number): 'Bonjour' | 'Bonsoir' {
  if (hour >= 5 && hour < 18) return 'Bonjour';
  return 'Bonsoir';
}

/** Premier mot de display_name, ou chaîne vide. */
export function firstName(displayName: string | null | undefined): string {
  if (!displayName) return '';
  const part = displayName.trim().split(/\s+/)[0];
  return part ?? '';
}

/**
 * Connecté au sens du site :
 * status ∈ {connected, webhook_error, token_invalid}.
 */
export function isBotConnected(status: Bot['status']): boolean {
  return (
    status === 'connected' ||
    status === 'webhook_error' ||
    status === 'token_invalid'
  );
}

export type QuotaTone = 'loading' | 'green' | 'orange' | 'red';

/** pct = used/limit * 100 ; limit=0 → loading si pas de données utiles. */
export function quotaTone(
  used: number | null,
  limit: number | null,
): QuotaTone {
  if (used === null || limit === null) return 'loading';
  if (limit === 0) return 'green';
  const pct = (used / limit) * 100;
  if (pct >= 90) return 'red';
  if (pct >= 65) return 'orange';
  return 'green';
}

export function quotaPercent(
  used: number | null,
  limit: number | null,
): number {
  if (used === null || limit === null || limit === 0) return 0;
  return Math.min(100, Math.max(0, (used / limit) * 100));
}

/** « Octobre 2026 » depuis created_at (ms), fuseau appareil. */
export function memberSince(createdAt: number): string {
  const d = new Date(createdAt);
  const month = MONTHS_FR[d.getMonth()] ?? '';
  const year = d.getFullYear();
  const labeled = month.charAt(0).toUpperCase() + month.slice(1);
  return `${labeled} ${year}`;
}

export function heroSubtitle(botCount: number): 'zero' | 'one' | 'many' {
  if (botCount <= 0) return 'zero';
  if (botCount === 1) return 'one';
  return 'many';
}
