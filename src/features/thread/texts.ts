/** Textes UI français — fil de messages (L5c + L5d). */
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
  // L5d
  composerPlaceholder: 'Message',
  send: 'Envoyer',
  statusSending: 'Envoi…',
  statusSent: 'Envoyé',
  statusQueued: 'En attente — réessayez',
  statusFailed: 'Échec',
  statusUnknown: 'Envoi incertain',
  statusLocalFailed: 'Non envoyé',
  retry: 'Réessayer',
  resend: 'Renvoyer',
  retryIn: (s: number) => `Réessayer dans ${s}s`,
  errorQuota: 'Quota journalier atteint',
  errorRateLimited: 'Trop de requêtes — réessayez plus tard',
  errorBotDisconnected: 'Bot déconnecté',
  errorValidation: 'Message invalide',
  errorNetwork: 'Réseau indisponible',
  errorGeneric: 'Envoi impossible',
  unknownResendWarn: 'Ce message peut déjà être parti. Renvoyer consomme une unité de quota.',
  cancel: 'Annuler',
  confirmResend: 'Renvoyer',
  retryTooEarly: (s: number) => `Réessayez dans ${s}s`,
  notRetryableFailed: 'Envoi définitivement échoué',
  notRetryableUnknown: 'Envoi incertain — utilisez Renvoyer',
  notRetryableSending: 'Envoi encore en cours',
  notFound: 'Message introuvable',
  errorCodes: {
    blocked: 'Destinataire bloqué',
    chat_not_found: 'Conversation introuvable',
    bad_request: 'Requête refusée',
    forbidden: 'Interdit',
    token_invalid: 'Jeton bot invalide',
    rate_limited: 'Limite Telegram',
    telegram_unavailable: 'Telegram indisponible',
    bot_disconnected: 'Bot déconnecté',
    parse_error: 'Erreur de mise en forme',
    buttons_rejected: 'Boutons refusés',
    not_forwardable: 'Non transférable',
    message_not_found: 'Message introuvable',
    internal_error: 'Erreur interne',
  } as Record<string, string>,
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

export function statusLabel(
  status: string | undefined,
  errorCode?: string | null,
): string {
  switch (status) {
    case 'sending':
      return threadTexts.statusSending;
    case 'sent':
      return threadTexts.statusSent;
    case 'queued':
      return threadTexts.statusQueued;
    case 'failed':
      if (errorCode && threadTexts.errorCodes[errorCode]) {
        return threadTexts.errorCodes[errorCode]!;
      }
      return errorCode === 'local_network'
        ? threadTexts.statusLocalFailed
        : threadTexts.statusFailed;
    case 'unknown':
      return threadTexts.statusUnknown;
    default:
      return '';
  }
}
