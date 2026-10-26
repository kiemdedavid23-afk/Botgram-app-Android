/**
 * Endpoints conversations (API.md § Conversations).
 * Types alignés sur ConversationSummary (core/realtime/events) — un seul type.
 */
import {authedHttp, type HttpResult} from '../session';
import type {ConversationSummary} from '../../realtime/events';

export type {ConversationSummary};

export type ConversationsPage = {
  items: ConversationSummary[];
  next_cursor: string | null;
};

/**
 * GET /bots/:id/conversations?limit=&cursor=
 * limit ≤ 50 ; ordre serveur : épinglées puis last_message_at décroissant.
 */
export async function listConversations(
  botId: string,
  params?: {limit?: number; cursor?: string},
): Promise<HttpResult<ConversationsPage>> {
  const limit = Math.min(Math.max(params?.limit ?? 20, 1), 50);
  const q = new URLSearchParams();
  q.set('limit', String(limit));
  if (params?.cursor) q.set('cursor', params.cursor);
  return authedHttp<ConversationsPage>({
    method: 'GET',
    path: `/bots/${botId}/conversations?${q.toString()}`,
  });
}

/**
 * GET /conversations/:id
 */
export async function getConversation(
  id: string,
): Promise<HttpResult<{conversation: ConversationSummary}>> {
  return authedHttp<{conversation: ConversationSummary}>({
    method: 'GET',
    path: `/conversations/${id}`,
  });
}

/**
 * GET /bots/:id/search/conversations?q=&limit=
 * Résultats sans last_message_text ni unread fiable ni photo contact.
 */
export async function searchConversations(
  botId: string,
  q: string,
  limit = 20,
): Promise<HttpResult<{items: ConversationSummary[]; next_cursor: null}>> {
  const params = new URLSearchParams();
  params.set('q', q);
  params.set('limit', String(Math.min(Math.max(limit, 1), 50)));
  return authedHttp<{items: ConversationSummary[]; next_cursor: null}>({
    method: 'GET',
    path: `/bots/${botId}/search/conversations?${params.toString()}`,
  });
}

/** POST /conversations/:id/pin — épinglage local. */
export async function pinConversation(
  id: string,
  pinned: boolean,
): Promise<HttpResult<{conversation: ConversationSummary}>> {
  return authedHttp<{conversation: ConversationSummary}>({
    method: 'POST',
    path: `/conversations/${id}/pin`,
    body: {pinned},
  });
}

/** DELETE /conversations/:id — suppression locale Botgram. */
export async function deleteConversation(
  id: string,
): Promise<HttpResult<{deleted: boolean}>> {
  return authedHttp<{deleted: boolean}>({
    method: 'DELETE',
    path: `/conversations/${id}`,
    body: {confirm: true},
  });
}
