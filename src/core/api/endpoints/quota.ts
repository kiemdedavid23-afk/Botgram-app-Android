/**
 * Endpoint quota (API.md § Profil).
 * GET /quota → { day, limit, used, remaining, resets_at }.
 */
import {authedHttp, type HttpResult} from '../session';

export type Quota = {
  day: string;
  limit: number;
  used: number;
  remaining: number;
  resets_at: number;
};

export async function getQuota(): Promise<HttpResult<Quota>> {
  return authedHttp<Quota>({method: 'GET', path: '/quota'});
}
