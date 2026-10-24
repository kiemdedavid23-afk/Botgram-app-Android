/**
 * GET /conversations/:id/messages (API.md).
 * Type Message unique (core/realtime/events).
 */
import {authedHttp, type HttpResult} from '../session';
import type {Message} from '../../realtime/events';

export type {Message};

export type MessagesPage = {
  items: Message[];
  next_cursor: string | null;
};

/**
 * Page la plus récente d'abord ; cursor pour remonter.
 * limit ≤ 50.
 */
export async function listMessages(
  conversationId: string,
  params?: {limit?: number; cursor?: string},
): Promise<HttpResult<MessagesPage>> {
  const limit = Math.min(Math.max(params?.limit ?? 50, 1), 50);
  const q = new URLSearchParams();
  q.set('limit', String(limit));
  if (params?.cursor) q.set('cursor', params.cursor);
  return authedHttp<MessagesPage>({
    method: 'GET',
    path: `/conversations/${conversationId}/messages?${q.toString()}`,
  });
}
