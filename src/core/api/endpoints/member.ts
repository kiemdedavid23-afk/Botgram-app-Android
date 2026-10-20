/**
 * Endpoints quota et membre.
 */
import {authedHttp, type HttpResult} from '../session';
import type {Member} from './auth';

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

export async function patchMe(fields: Partial<Pick<Member, 'display_name' | 'country' | 'usage' | 'phone' | 'organization'>>): Promise<HttpResult<{member: Member}>> {
  return authedHttp<{member: Member}>({method: 'PATCH', path: '/me', body: fields});
}

export async function requestDelete(uiLanguage: 'fr' | 'en' = 'fr'): Promise<HttpResult<{requested: boolean; expires_in: number; code_length: number}>> {
  return authedHttp({method: 'POST', path: '/me/delete/request', body: {ui_language: uiLanguage}});
}

export async function confirmDelete(code: string): Promise<HttpResult<{deleted: true}>> {
  return authedHttp<{deleted: true}>({method: 'POST', path: '/me/delete', body: {code}});
}
