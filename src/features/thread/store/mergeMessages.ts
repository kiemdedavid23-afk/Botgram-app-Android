import type {Message} from '../../../core/realtime/events';

/** Tri croissant (plus récent en bas). */
export function sortMessagesAsc(list: Message[]): Message[] {
  return [...list].sort((a, b) => {
    const ta = a.created_at ?? a.sent_at ?? 0;
    const tb = b.created_at ?? b.sent_at ?? 0;
    if (ta !== tb) return ta - tb;
    return a.id.localeCompare(b.id);
  });
}

/** Fusion par id, sans doublon. */
export function mergeMessages(
  current: Message[],
  incoming: Message[],
): Message[] {
  const map = new Map(current.map(m => [m.id, m]));
  for (const m of incoming) {
    map.set(m.id, {...(map.get(m.id) ?? {}), ...m});
  }
  return sortMessagesAsc(Array.from(map.values()));
}

export function messageTimestamp(m: Message): number {
  return m.created_at ?? m.sent_at ?? 0;
}
