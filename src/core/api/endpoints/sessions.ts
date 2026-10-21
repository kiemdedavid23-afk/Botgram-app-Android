/**
 * Endpoints appareils / sessions (API.md § Auth).
 * GET /auth/sessions, DELETE /auth/sessions/:id, POST /auth/logout-all.
 */
import {authedHttp, type HttpResult} from '../session';

export type SessionApp = {
  platform: string;
  channel: string;
  build: string;
  version: string;
} | null;

export type Session = {
  id: string;
  device: string;
  created_at: number;
  last_active_at: number;
  expires_at?: number;
  current: boolean;
  app: SessionApp;
};

export async function listSessions(): Promise<
  HttpResult<{items: Session[]}>
> {
  return authedHttp<{items: Session[]}>({
    method: 'GET',
    path: '/auth/sessions',
  });
}

export async function revokeSession(
  id: string,
): Promise<HttpResult<{revoked: true}>> {
  return authedHttp<{revoked: true}>({
    method: 'DELETE',
    path: `/auth/sessions/${id}`,
  });
}

export async function logoutAllSessions(): Promise<HttpResult<unknown>> {
  return authedHttp<unknown>({
    method: 'POST',
    path: '/auth/logout-all',
  });
}
