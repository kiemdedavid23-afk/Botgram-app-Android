/**
 * Messages (API.md) — list / send / retry / read / attachment.
 */
import {authedHttp, type HttpResult} from '../session';
import {authedHttpBinary} from '../session';
import type {HttpBinaryResult} from '../http.binary';
import type {Message} from '../../realtime/events';

export type {Message};

export type MessagesPage = {
  items: Message[];
  next_cursor: string | null;
};

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

export async function sendMessage(
  conversationId: string,
  body: {text: string; client_message_id: string},
): Promise<HttpResult<{message: Message}>> {
  return authedHttp<{message: Message}>({
    method: 'POST',
    path: `/conversations/${conversationId}/messages`,
    body: {
      text: body.text,
      client_message_id: body.client_message_id,
    },
  });
}

export async function retryMessage(
  messageId: string,
): Promise<HttpResult<{message: Message; retried: boolean}>> {
  return authedHttp<{message: Message; retried: boolean}>({
    method: 'POST',
    path: `/messages/${messageId}/retry`,
  });
}

export async function markConversationRead(
  conversationId: string,
): Promise<HttpResult<{unread_count: number}>> {
  return authedHttp<{unread_count: number}>({
    method: 'POST',
    path: `/conversations/${conversationId}/read`,
  });
}

/** GET /messages/:id/attachment — via authedHttpBinary (refresh 401). */
export async function fetchAttachment(
  messageId: string,
  signal?: AbortSignal,
): Promise<HttpBinaryResult> {
  return authedHttpBinary({
    method: 'GET',
    path: `/messages/${messageId}/attachment`,
    signal,
    timeoutMs: 120_000,
  });
}
