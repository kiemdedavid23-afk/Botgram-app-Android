import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

export function sortItems(list: ConversationSummary[]): ConversationSummary[] {
  return [...list].sort((a, b) => {
    const ap = a.pinned ? 1 : 0;
    const bp = b.pinned ? 1 : 0;
    if (ap !== bp) return bp - ap;
    return (b.last_message_at ?? 0) - (a.last_message_at ?? 0);
  });
}

export function mergeById(
  current: ConversationSummary[],
  incoming: ConversationSummary[],
  opts?: {fromSearch?: boolean},
): ConversationSummary[] {
  const map = new Map(current.map(c => [c.id, c]));
  for (const item of incoming) {
    const prev = map.get(item.id);
    if (opts?.fromSearch && prev) continue;
    if (opts?.fromSearch) {
      map.set(item.id, {
        ...item,
        unread_count: prev?.unread_count ?? 0,
        last_message_text: prev?.last_message_text ?? null,
        photo_url: prev?.photo_url ?? null,
      });
    } else {
      map.set(item.id, prev ? {...prev, ...item} : item);
    }
  }
  return sortItems(Array.from(map.values()));
}

export function displayTitle(c: ConversationSummary): string {
  if (c.title) return c.title;
  const name = [c.first_name, c.last_name].filter(Boolean).join(' ');
  if (name) return name;
  if (c.username) return `@${c.username}`;
  return c.id;
}
