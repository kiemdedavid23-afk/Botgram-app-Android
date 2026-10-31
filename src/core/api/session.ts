/**
 * Couche authentifiée au-dessus de http() (seul fetch).
 * Single-flight refresh, refresh token écrit avant access, fin de session uniquement sur les 4 codes.
 */
import {http, type HttpRequestOptions, type HttpResult} from './http';
import {httpBinary, type HttpBinaryResult} from './http.binary';
export type {HttpResult} from './http';
import {refresh as refreshEndpoint} from './endpoints/auth';
import {parseLatest, type LatestBuild} from '../update/latest';
import {getAccessToken, getRefreshToken, saveTokenPair, clearTokens} from '../storage';

export type SessionEndReason = 'revoked' | 'session_expired' | 'invalid' | 'refresh_reuse';

export type SessionEvent =
  | {type: 'ended'; reason: SessionEndReason}
  | {type: 'upgrade_required'; latest?: LatestBuild}
  | {type: 'update'; level: 'none' | 'optional' | 'required'};

type Listener = (event: SessionEvent) => void;
const listeners = new Set<Listener>();

export function onSessionEvent(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function emit(event: SessionEvent): void {
  for (const l of listeners) l(event);
}

let refreshInFlight: Promise<{ok: true} | {ok: false; end?: SessionEndReason}> | null = null;

async function doRefresh(): Promise<{ok: true} | {ok: false; end?: SessionEndReason}> {
  const rt = await getRefreshToken();
  if (!rt) {
    await clearTokens();
    emit({type: 'ended', reason: 'invalid'});
    return {ok: false, end: 'invalid'};
  }

  const result = await refreshEndpoint(rt);

  if (result.ok) {
    await saveTokenPair({
      refreshToken: result.data.refresh_token,
      accessToken: result.data.access_token,
    });
    const update = result.headers.get('x-app-update');
    if (update === 'none' || update === 'optional' || update === 'required') {
      emit({type: 'update', level: update});
    }
    return {ok: true};
  }

  if (result.status === 426) {
    const latest = parseLatest((result.error.details as {latest?: unknown} | undefined)?.latest);
    emit({type: 'upgrade_required', latest});
    return {ok: false};
  }

  const reason = (result.error.details as {reason?: string} | undefined)?.reason;

  if (reason === 'refresh_race') {
    let retryAfter = Number(result.headers.get('retry-after') ?? 1);
    if (Number.isNaN(retryAfter) || retryAfter < 1) retryAfter = 1;
    if (retryAfter > 30) retryAfter = 30;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      await new Promise<void>(resolve => { setTimeout(() => resolve(), retryAfter * 1000); });
      const stored = await getRefreshToken();
      if (stored && stored !== rt) {
        // autre instance a renouvelé : adopter et rejouer sans nouveau refresh
        return {ok: true};
      }
      const retry = await refreshEndpoint(rt);
      if (retry.ok) {
        await saveTokenPair({
          refreshToken: retry.data.refresh_token,
          accessToken: retry.data.access_token,
        });
        return {ok: true};
      }
      if (retry.status === 426) {
        const latest = parseLatest((retry.error.details as {latest?: unknown} | undefined)?.latest);
        emit({type: 'upgrade_required', latest});
        return {ok: false};
      }
      const rReason = (retry.error.details as {reason?: string} | undefined)?.reason;
      if (
        rReason === 'revoked' ||
        rReason === 'session_expired' ||
        rReason === 'invalid' ||
        rReason === 'refresh_reuse'
      ) {
        await clearTokens();
        emit({type: 'ended', reason: rReason});
        return {ok: false, end: rReason};
      }
    }
    return {ok: false};
  }

  if (
    reason === 'revoked' ||
    reason === 'session_expired' ||
    reason === 'invalid' ||
    reason === 'refresh_reuse'
  ) {
    await clearTokens();
    emit({type: 'ended', reason});
    return {ok: false, end: reason};
  }

  // réseau, 5xx, 429, etc. → session conservée
  return {ok: false};
}

async function singleFlightRefresh(): Promise<{ok: true} | {ok: false; end?: SessionEndReason}> {
  if (refreshInFlight) return refreshInFlight;
  refreshInFlight = doRefresh().finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export async function authedHttp<T>(
  options: HttpRequestOptions,
): Promise<HttpResult<T>> {
  const access = await getAccessToken();
  const first = await http<T>({...options, accessToken: access});

  const update = first.headers.get('x-app-update');
  if (update === 'none' || update === 'optional' || update === 'required') {
    emit({type: 'update', level: update});
  }

  if (!first.ok && first.status === 426) {
    const latest = parseLatest((first.error.details as {latest?: unknown} | undefined)?.latest);
    emit({type: 'upgrade_required', latest});
    return first;
  }

  if (!first.ok && first.status === 401) {
    const reason = (first.error.details as {reason?: string} | undefined)?.reason;
    if (reason === 'access_expired' || reason === 'revoked' || reason === 'session_expired' || reason === 'invalid') {
      const current = await getAccessToken();
      if (current && current !== access) {
        return http<T>({...options, accessToken: current});
      }
      const refreshed = await singleFlightRefresh();
      if (refreshed.ok) {
        const newAccess = await getAccessToken();
        return http<T>({...options, accessToken: newAccess});
      }
      if (refreshed.end) {
        return {
          ok: false,
          error: {code: 'SESSION_ENDED', message: refreshed.end},
          requestId: first.requestId,
          status: 401,
          headers: first.headers,
        };
      }
    }
  }

  return first;
}


/** Même politique que authedHttp pour les GET binaires (attachment). */
export async function authedHttpBinary(
  options: Omit<HttpRequestOptions, 'body'>,
): Promise<HttpBinaryResult> {
  const access = await getAccessToken();
  const first = await httpBinary({...options, accessToken: access});

  const update = first.headers.get('x-app-update');
  if (update === 'none' || update === 'optional' || update === 'required') {
    emit({type: 'update', level: update});
  }

  if (!first.ok && first.status === 426) {
    const latest = parseLatest((first.error.details as {latest?: unknown} | undefined)?.latest);
    emit({type: 'upgrade_required', latest});
    return first;
  }

  if (!first.ok && first.status === 401) {
    const reason = (first.error.details as {reason?: string} | undefined)?.reason;
    if (
      reason === 'access_expired' ||
      reason === 'revoked' ||
      reason === 'session_expired' ||
      reason === 'invalid'
    ) {
      const current = await getAccessToken();
      if (current && current !== access) {
        return httpBinary({...options, accessToken: current});
      }
      const refreshed = await singleFlightRefresh();
      if (refreshed.ok) {
        const newAccess = await getAccessToken();
        return httpBinary({...options, accessToken: newAccess});
      }
      if (refreshed.end) {
        return {
          ok: false,
          error: {code: 'SESSION_ENDED', message: refreshed.end},
          requestId: first.requestId,
          status: 401,
          headers: first.headers,
        };
      }
    }
  }

  return first;
}
