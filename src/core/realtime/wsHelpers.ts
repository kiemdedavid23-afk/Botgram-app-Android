/**
 * Helpers WebSocket (délais, URL, backoff) — section 7.3 / 7.4.
 */
import type {Clock} from './RealtimeTransport';

export const HELLO_TIMEOUT_MS = 8000;
export const PONG_TIMEOUT_MS = 10000;
export const MAX_BACKOFF_MS = 60000;
export const STABLE_RESET_MS = 30000;
export const RECONSIDER_MS = 5 * 60 * 1000;
export const TOO_MANY_WAIT_MS = 5 * 60 * 1000;
export const REPLACED_WAIT_MS = 60000;
export const DEDUP_SIZE = 200;

export function buildWsUrl(endpointUrl: string, ticket: string): string {
  const sep = endpointUrl.includes('?') ? '&' : '?';
  return `${endpointUrl}${sep}ticket=${encodeURIComponent(ticket)}`;
}

export function jitteredBackoff(attempt: number): number {
  const base = Math.min(MAX_BACKOFF_MS, 1000 * 2 ** Math.min(attempt, 6));
  const jitter = base * (0.7 + Math.random() * 0.6);
  return Math.min(MAX_BACKOFF_MS, Math.round(jitter));
}

export function computeWait(
  clock: Clock,
  waitUntil: number,
  attempt: number,
): number {
  const now = clock();
  const forced = Math.max(0, waitUntil - now);
  if (forced > 0) return forced;
  return jitteredBackoff(attempt);
}
