/**
 * Endpoints bots. Types stricts d'après API.md § Bots.
 * Tout passe par authedHttp. Aucun champ inventé.
 */
import {authedHttp, type HttpResult} from '../session';

export type BotStatus =
  | 'pending'
  | 'connected'
  | 'webhook_error'
  | 'token_invalid'
  | 'disconnected';

export type Bot = {
  id: string;
  telegram_bot_id: string | number;
  username: string | null;
  name: string;
  status: BotStatus;
  selected: boolean;
  muted: boolean;
  created_at: number;
  connected_at: number | null;
  disconnected_at: number | null;
};

export type PreviewResponse = {
  telegram_bot_id: string | number;
  username: string | null;
  name: string;
  webhook_set: boolean;
  webhook_is_botgram: boolean;
  replace_required: boolean;
  already_linked: boolean;
};

export async function listBots(): Promise<HttpResult<{bots: Bot[]}>> {
  return authedHttp<{bots: Bot[]}>({method: 'GET', path: '/bots'});
}

export async function getBot(id: string): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'GET', path: `/bots/${id}`});
}

export async function previewToken(
  token: string,
): Promise<HttpResult<PreviewResponse>> {
  return authedHttp<PreviewResponse>({
    method: 'POST',
    path: '/bots/preview-token',
    body: {token},
  });
}

export async function createBot(params: {
  token: string;
  confirm_replace_webhook?: boolean;
}): Promise<HttpResult<{bot: Bot}>> {
  const body: {token: string; confirm_replace_webhook?: boolean} = {
    token: params.token,
  };
  if (params.confirm_replace_webhook !== undefined) {
    body.confirm_replace_webhook = params.confirm_replace_webhook;
  }
  return authedHttp<{bot: Bot}>({method: 'POST', path: '/bots', body});
}

export async function setMuted(
  id: string,
  muted: boolean,
): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({
    method: 'PATCH',
    path: `/bots/${id}`,
    body: {muted},
  });
}

export async function selectBot(id: string): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({method: 'POST', path: `/bots/${id}/select`});
}

export async function retryWebhook(
  id: string,
): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({
    method: 'POST',
    path: `/bots/${id}/retry-webhook`,
  });
}

export async function resyncWebhook(
  id: string,
): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({
    method: 'POST',
    path: `/bots/${id}/resync-webhook`,
  });
}

export async function disconnectBot(
  id: string,
  dropPending = false,
): Promise<HttpResult<{bot: Bot}>> {
  return authedHttp<{bot: Bot}>({
    method: 'POST',
    path: `/bots/${id}/disconnect`,
    body: {drop_pending_updates: dropPending},
  });
}

export async function deleteBot(
  id: string,
): Promise<HttpResult<{deleted: boolean}>> {
  return authedHttp<{deleted: boolean}>({
    method: 'DELETE',
    path: `/bots/${id}`,
  });
}
