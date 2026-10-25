/**
 * Messages (API.md) — list / send / retry / read / attachment.
 * Type Message unique (core/realtime/events).
 */
import {authedHttp, type HttpResult} from '../session';
import {httpBinary, type HttpBinaryResult} from '../http';
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

/**
 * GET /messages/:id/attachment — binaire via httpBinary (R1).
 * accessToken fourni par l'appelant (session) ; jamais dans l'URL.
 */
export async function fetchAttachment(
  messageId: string,
  accessToken: string | null,
  signal?: AbortSignal,
): Promise<HttpBinaryResult> {
  return httpBinary({
    method: 'GET',
    path: `/messages/${messageId}/attachment`,
    accessToken,
    signal,
    timeoutMs: 120_000,
  });
}
