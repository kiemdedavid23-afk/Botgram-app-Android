/** Constantes push : canaux Android (contrat 5.7) et seuil Android 13. */
export const PUSH_CHANNELS = {
  messages: {id: 'messages', name: 'Messages'},
  updates: {id: 'updates', name: 'Mises à jour'},
} as const;

/** POST_NOTIFICATIONS est demandée à l'exécution à partir d'Android 13 (API 33). */
export const ANDROID_NOTIFICATION_PERMISSION_API = 33;

export const PUSH_DEVICE_PREFIX = 'Android';
