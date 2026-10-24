/** Textes UI français — fil de messages (L5c). */
export const threadTexts = {
  offlineBanner: 'Hors ligne — lecture seule',
  emptyTitle: 'Aucun message',
  emptySubtitle: 'Les messages apparaîtront ici.',
  loadError: 'Erreur de chargement',
  kindPhoto: 'Photo',
  kindDocument: 'Document',
  kindAlbum: 'Album',
  kindCallback: 'Action',
  kindOther: 'Message',
  yesterday: 'Hier',
  weekdays: [
    'Dimanche',
    'Lundi',
    'Mardi',
    'Mercredi',
    'Jeudi',
    'Vendredi',
    'Samedi',
  ] as const,
};

export function formatMessageTime(ts: number | undefined): string {
  if (ts === undefined || ts <= 0) return '';
  const d = new Date(ts);
  const h = d.getHours().toString().padStart(2, '0');
  const m = d.getMinutes().toString().padStart(2, '0');
  return `${h}:${m}`;
}

export function formatDayLabel(ts: number, now = Date.now()): string {
  const d = new Date(ts);
  const n = new Date(now);
  const startToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86400000;
  if (startMsg === startToday) return "Aujourd'hui";
  if (startMsg === startToday - dayMs) return threadTexts.yesterday;
  if (now - ts < 7 * dayMs) {
    return threadTexts.weekdays[d.getDay()] ?? '';
  }
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}

export function kindLabel(kind: string): string {
  switch (kind) {
    case 'photo':
      return threadTexts.kindPhoto;
    case 'document':
      return threadTexts.kindDocument;
    case 'album':
      return threadTexts.kindAlbum;
    case 'callback_query':
      return threadTexts.kindCallback;
    default:
      return threadTexts.kindOther;
  }
}
