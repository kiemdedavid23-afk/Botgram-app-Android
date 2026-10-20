/**
 * Endpoints profil membre (API.md § Profil).
 * PATCH /me, POST /me/delete/request, POST /me/delete.
 * Champs inconnus refusés par le Worker : n'envoyer que ceux documentés.
 */
import {authedHttp, type HttpResult} from '../session';
import type {Member} from './auth';

export type PatchMeFields = {
  display_name?: string;
  country?: string;
  usage?: string;
  phone?: string;
  /** "" efface l'organisation */
  organization?: string;
};

export type DeleteRequestResponse = {
  requested: boolean;
  expires_in: number;
  code_length: number;
};

export async function patchMe(
  fields: PatchMeFields,
): Promise<HttpResult<{member: Member}>> {
  const body: Record<string, string> = {};
  if (fields.display_name !== undefined) {
    body.display_name = fields.display_name;
  }
  if (fields.country !== undefined) {
    body.country = fields.country;
  }
  if (fields.usage !== undefined) {
    body.usage = fields.usage;
  }
  if (fields.phone !== undefined) {
    body.phone = fields.phone;
  }
  if (fields.organization !== undefined) {
    body.organization = fields.organization;
  }
  return authedHttp<{member: Member}>({
    method: 'PATCH',
    path: '/me',
    body,
  });
}

export async function requestDelete(
  uiLanguage: 'fr' | 'en' = 'fr',
): Promise<HttpResult<DeleteRequestResponse>> {
  return authedHttp<DeleteRequestResponse>({
    method: 'POST',
    path: '/me/delete/request',
    body: {ui_language: uiLanguage},
  });
}

export async function confirmDelete(
  code: string,
): Promise<HttpResult<{deleted: true}>> {
  return authedHttp<{deleted: true}>({
    method: 'POST',
    path: '/me/delete',
    body: {code},
  });
}
