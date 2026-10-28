/**
 * Store de la photo des bots — UNE seule source pour toute l'app
 * (profil du bot, barre du bas, feuille de bascule, tableau de bord, gestion…).
 *  - lecture du cache disque (2 jours) → affichage immédiat ;
 *  - cache périmé : on garde l'ancienne image et on rafraîchit en arrière-plan ;
 *  - changement ou suppression de la photo : tous les écrans se mettent à jour d'un coup.
 */
import {create} from 'zustand';
import {
  readBotPhotoCache,
  downloadBotPhoto,
  markBotPhotoRemoved,
  dropBotPhoto,
  clearBotPhotoCache,
  BOT_PHOTO_TTL_MS,
} from '../../core/media/botPhotoCache';
import {registerMemberDataCleaner} from '../../core/utils/memberData';

type Entry = {
  /** null = pas de photo (ou pas encore connue). */
  uri: string | null;
  /** true dès que l'état est connu (cache lu ou réseau). */
  known: boolean;
  /** Dernière vérification dans cette session (ms). */
  checkedAt: number;
};

type BotPhotoStore = {
  photos: Record<string, Entry>;
  ensure: (botId: string) => Promise<void>;
  /** Force un nouveau téléchargement (après envoi d'une photo). */
  refresh: (botId: string) => Promise<boolean>;
  /** Après suppression de la photo côté bot. */
  markRemoved: (botId: string) => Promise<void>;
  /** Bot supprimé / déconnecté. */
  forget: (botId: string) => Promise<void>;
  clear: () => void;
};

const inflight = new Map<string, Promise<void>>();

export const useBotPhotoStore = create<BotPhotoStore>((set, get) => {
  const put = (botId: string, uri: string | null) =>
    set(s => ({
      photos: {...s.photos, [botId]: {uri, known: true, checkedAt: Date.now()}},
    }));

  return {
    photos: {},

    ensure: botId => {
      const running = inflight.get(botId);
      if (running) return running;

      const job = (async () => {
        const entry = get().photos[botId];
        // Déjà vérifiée récemment dans cette session : rien à faire.
        if (entry?.known && Date.now() - entry.checkedAt < BOT_PHOTO_TTL_MS) {
          return;
        }
        const cached = await readBotPhotoCache(botId);
        if (cached) {
          put(botId, cached.uri);
          if (cached.fresh) return;
        }
        // Absent ou périmé : réseau. En cas d'échec on garde ce qui s'affiche déjà.
        const res = await downloadBotPhoto(botId);
        if (res.ok) put(botId, res.uri);
      })()
        .catch(() => undefined)
        .finally(() => {
          inflight.delete(botId);
        });

      inflight.set(botId, job);
      return job;
    },

    refresh: async botId => {
      const res = await downloadBotPhoto(botId);
      if (res.ok) {
        put(botId, res.uri);
        return true;
      }
      return false;
    },

    markRemoved: async botId => {
      await markBotPhotoRemoved(botId);
      put(botId, null);
    },

    forget: async botId => {
      await dropBotPhoto(botId);
      set(s => {
        const photos = {...s.photos};
        delete photos[botId];
        return {photos};
      });
    },

    clear: () => {
      inflight.clear();
      set({photos: {}});
    },
  };
});

registerMemberDataCleaner(async () => {
  useBotPhotoStore.getState().clear();
  await clearBotPhotoCache();
});
