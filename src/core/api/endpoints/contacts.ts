/**
 * Endpoints contacts (API.md § Contacts).
 * Un contact n'existe qu'après son premier message au bot.
 */
import {authedHttp, type HttpResult} from '../session';

export type Contact = {
  id: string;
  bot_id: string;
  telegram_user_id?: number;
  first_name?: string | null;
  last_name?: string | null;
  username?: string | null;
  has_photo?: boolean;
  photo_url?: string | null;
  initials?: string | null;
  created_at?: number;
  updated_at?: number;
};

export type ContactsPage = {
  items: Contact[];
  next_cursor: string | null;
};

const MAX_LIMIT = 50;

function clampLimit(limit: number | undefined, fallback: number): number {
  return Math.min(Math.max(limit ?? fallback, 1), MAX_LIMIT);
}

/** GET /bots/:id/contacts?limit=&cursor= — du plus récemment actif au plus ancien. */
export async function listContacts(
  botId: string,
  params?: {limit?: number; cursor?: string},
): Promise<HttpResult<ContactsPage>> {
  const q = new URLSearchParams();
  q.set('limit', String(clampLimit(params?.limit, 20)));
  if (params?.cursor) q.set('cursor', params.cursor);
  return authedHttp<ContactsPage>({
    method: 'GET',
    path: `/bots/${botId}/contacts?${q.toString()}`,
  });
}

/** GET /bots/:id/search/contacts?q=&limit= — prénom, nom et pseudo. */
export async function searchContacts(
  botId: string,
  query: string,
  limit = 20,
): Promise<HttpResult<{items: Contact[]; next_cursor: null}>> {
  const q = new URLSearchParams();
  q.set('q', query);
  q.set('limit', String(clampLimit(limit, 20)));
  return authedHttp<{items: Contact[]; next_cursor: null}>({
    method: 'GET',
    path: `/bots/${botId}/search/contacts?${q.toString()}`,
  });
}
