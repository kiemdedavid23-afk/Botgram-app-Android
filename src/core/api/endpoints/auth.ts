/**
 * Endpoints d'authentification. Types stricts d'après API.md.
 * X-Token-Mode: body uniquement sur verify et refresh.
 */
import {http, type HttpResult} from '../http';
import {authedHttp} from '../session';

export type Member = {
  id: string;
  email: string;
  email_verified: boolean;
  display_name: string;
  role: string;
  status: string;
  country: string | null;
  usage: string | null;
  phone: string | null;
  organization: string | null;
  selected_bot_id: string | null;
  created_at: number;
};

export type RequestCodeResponse = {
  requested: boolean;
  expires_in: number;
  code_length: number;
};

export type VerifySuccess = {
  member: Member;
  is_new: boolean;
  access_token: string;
  refresh_token: string;
  access_expires_in: number;
  session_expires_at: number;
};

export type NeedsProfile = {
  needs_profile: true;
  missing: string[];
};

export type VerifyResponse = VerifySuccess | NeedsProfile;

export type RefreshResponse = {
  access_token: string;
  refresh_token: string;
  access_expires_in: number;
  session_expires_at: number;
};

export type MeResponse = {
  member: Member;
};

export async function requestCode(
  email: string,
  uiLanguage: 'fr' | 'en' = 'fr',
): Promise<HttpResult<RequestCodeResponse>> {
  return http<RequestCodeResponse>({
    method: 'POST',
    path: '/auth/code/request',
    body: {email, ui_language: uiLanguage},
  });
}

export async function verifyCode(params: {
  email: string;
  code: string;
  display_name?: string;
  country?: string;
  usage?: string;
  phone?: string;
  organization?: string;
}): Promise<HttpResult<VerifyResponse>> {
  return http<VerifyResponse>({
    method: 'POST',
    path: '/auth/code/verify',
    body: params,
    tokenModeBody: true,
  });
}

export async function refresh(refreshToken: string): Promise<HttpResult<RefreshResponse>> {
  return http<RefreshResponse>({
    method: 'POST',
    path: '/auth/refresh',
    body: {refresh_token: refreshToken},
    tokenModeBody: true,
  });
}

export async function logout(): Promise<HttpResult<{ok: true} | null>> {
  return authedHttp({method: 'POST', path: '/auth/logout'});
}

export async function logoutAll(): Promise<HttpResult<{ok: true} | null>> {
  return authedHttp({method: 'POST', path: '/auth/logout-all'});
}

export async function me(): Promise<HttpResult<MeResponse>> {
  return authedHttp<MeResponse>({method: 'GET', path: '/auth/me'});
}
