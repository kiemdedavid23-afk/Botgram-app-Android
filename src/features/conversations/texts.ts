/** Textes UI français — feature conversations (L5b). */
export const conversationsTexts = {
  title: 'Échanges',
  searchPlaceholder: 'Rechercher',
  folderAll: 'Tous',
  folderPersonal: 'Personnel',
  folderWork: 'Travail',
  folderUnread: 'Non lus',
  emptyTitle: 'Aucune conversation',
  emptySubtitle: 'Les échanges de ce bot apparaîtront ici.',
  emptySearch: 'Aucun résultat',
  retry: 'Réessayer',
  offlineBanner: 'Hors ligne — lecture seule',
  yesterday: 'Hier',
  loading: 'Chargement…',
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

/**
 * Format d'heure de liste : aujourd'hui HH:mm, hier, jour, sinon date.
 */
export function formatConversationTime(
  ts: number | undefined,
  now = Date.now(),
): string {
  if (ts === undefined || ts <= 0) return '';
  const d = new Date(ts);
  const n = new Date(now);
  const startToday = new Date(n.getFullYear(), n.getMonth(), n.getDate()).getTime();
  const startMsg = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const dayMs = 86400000;
  if (startMsg === startToday) {
    const h = d.getHours().toString().padStart(2, '0');
    const m = d.getMinutes().toString().padStart(2, '0');
    return `${h}:${m}`;
  }
  if (startMsg === startToday - dayMs) {
    return conversationsTexts.yesterday;
  }
  if (now - ts < 7 * dayMs) {
    return conversationsTexts.weekdays[d.getDay()] ?? '';
  }
  const dd = d.getDate().toString().padStart(2, '0');
  const mm = (d.getMonth() + 1).toString().padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
