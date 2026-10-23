/**
 * Endpoints temps réel : POST /ws/ticket et GET /updates.
 * Uniquement utilisés par core/realtime (R6).
 * Aucun champ inventé ; types d'après API.md et WEBSOCKET.md v15.5.
 */
import {authedHttp, type HttpResult} from '../session';
import type {ConversationSummary} from '../../realtime/events';

export type WsEndpoint = {
  id: string;
  url: string;
  ticket: string;
  expires_in: number;
};

export type WsTicketResponse = {
  endpoints: WsEndpoint[];
  heartbeat_s: number;
  poll_fallback_s: number;
  server_time: number;
};

export type UpdatesResponse = {
  server_time: number;
  conversations: ConversationSummary[];
  unread: Record<string, number>;
  has_more: boolean;
};

/**
 * POST /ws/ticket — session, sans corps.
 * Liste ordonnée par priorité ; vide = pas de temps réel.
 */
export async function requestWsTicket(): Promise<HttpResult<WsTicketResponse>> {
  return authedHttp<WsTicketResponse>({
    method: 'POST',
    path: '/ws/ticket',
  });
}

/**
 * GET /updates?since=<ms>
 * since = server_time de la dernière réponse /updates (0 la première fois).
 * Jamais le server_time de hello.
 */
export async function fetchUpdates(
  since: number,
): Promise<HttpResult<UpdatesResponse>> {
  const q = since > 0 ? `?since=${since}` : '';
  return authedHttp<UpdatesResponse>({
    method: 'GET',
    path: `/updates${q}`,
  });
}
