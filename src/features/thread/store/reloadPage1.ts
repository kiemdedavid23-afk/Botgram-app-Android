import {listMessages} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import {cacheSetString} from '../../../core/storage';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {mergeMessages} from './mergeMessages';
import {dropLocalNetworkDupes} from './retryErrors';
import {threadMetrics} from '../../../shared/theme/threadMetrics';

const cacheKey = (id: string) => `thread.messages.${id}`;

/** Recharge page 1 et fusionne sans jeter les pages plus anciennes. */
export async function reloadPage1Merge(
  get: () => {
    conversationId: string | null;
    items: Message[];
    nextCursor: string | null;
  },
  set: (
    partial:
      | Partial<{
          items: Message[];
          nextCursor: string | null;
          offline: boolean;
          error: string | null;
        }>
      | ((s: {
          items: Message[];
          nextCursor: string | null;
        }) => Partial<{
          items: Message[];
          nextCursor: string | null;
          offline: boolean;
          error: string | null;
        }>),
  ) => void,
): Promise<void> {
  const cid = get().conversationId;
  if (!cid) return;
  const res = await listMessages(cid, {limit: threadMetrics.pageSize});
  if (get().conversationId !== cid || !res.ok) return;
  const page1 = res.data.items;
  set(s => {
    const merged = dropLocalNetworkDupes(mergeMessages(s.items, page1));
    const toCache = merged.slice(-threadMetrics.cacheLimit);
    fireAndForget(cacheSetString(cacheKey(cid), JSON.stringify(toCache)));
    const keepCursor =
      s.nextCursor !== null && s.items.length > page1.length
        ? s.nextCursor
        : res.data.next_cursor;
    return {
      items: merged,
      nextCursor: keepCursor,
      offline: false,
      error: null,
    };
  });
}
