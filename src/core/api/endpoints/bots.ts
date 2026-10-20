/**
 * Endpoints bots. Types stricts d'après API.md.
 */
import {authedHttp, type HttpResult} from '../session';

export type BotStatus = 'pending' | 'connected' | 'webhook_error' | 'token_invalid' | 'disconnected';

export type Bot = {
  id: string;
  telegram_bot_id: string;
  username: string;
  name: string;
  status: BotStatus;
  selected: boolean;
  muted: boolean;
  created_at: number;
  connected_at: number | null;
  disconnected_at: number | null;
};

export type PreviewResponse = {
  telegram_bot_id: string;
  username: string;
  name: string;
  webhook_set: boolean;
  webhook_is_botgram: boolean;
  replace_required: boolean;
  already_linked: boolean;
};

export async function listBots(): Promise<HttpResult<{bots: Bot[]}>> {
  return authedHttp<{bots: Bot[]}>({method: 'GET', path: '/bots'});
}

export async function previewToken(token: string): Promise<HttpResult<PreviewResponse>> {
  return authedHttp<PreviewResponse>({method: 'POST', path: '/bots/preview-token', body: {token}});
}

export async function createBot(params: {token: string; confirm_replace_webhook?: boolean}): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: '/bots', body: params});
}

export async function setMuted(id: string, muted: boolean): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'PATCH', path: `/bots/${id}`, body: {muted}});
}

export async function selectBot(id: string): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: `/bots/${id}/select`});
}

export async function retryWebhook(id: string): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: `/bots/${id}/retry-webhook`});
}

export async function resyncWebhook(id: string): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: `/bots/${id}/resync-webhook`});
}

export async function disconnectBot(id: string, dropPending = false): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: `/bots/${id}/disconnect`, body: {drop_pending_updates: dropPending}});
}

export async function deleteBot(id: string): Promise<HttpResult<{ok: true} | null>> {
  return authedHttp({method: 'DELETE', path: `/bots/${id}`});
}
