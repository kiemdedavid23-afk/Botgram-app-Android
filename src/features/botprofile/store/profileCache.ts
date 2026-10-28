/**
 * Cache disque (chiffré, MMKV) du profil d'un bot — durée de vie : 2 jours.
 * Affichage immédiat à la réouverture ; au-delà de 2 jours on garde l'ancien profil
 * à l'écran et on le rafraîchit en arrière-plan (voir botProfileStore.load).
 */
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
  cacheDeleteByPrefix,
} from '../../../core/storage';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';

export const PROFILE_TTL_MS = 2 * 24 * 60 * 60 * 1000;
const PREFIX = 'botprofile.v1.';

type Entry = {
  v: 1;
  savedAt: number;
  languagesLoaded: boolean;
  profile: BotProfile;
};

export type CachedProfile = {
  profile: BotProfile;
  languagesLoaded: boolean;
  fresh: boolean;
};

export async function readProfileCache(
  botId: string,
): Promise<CachedProfile | null> {
  try {
    const raw = await cacheGetString(PREFIX + botId);
    if (!raw) return null;
    const e = JSON.parse(raw) as Partial<Entry>;
    if (e.v !== 1 || typeof e.savedAt !== 'number' || !e.profile) return null;
    if (e.profile.bot_id !== botId) return null;
    return {
      profile: e.profile,
      languagesLoaded: e.languagesLoaded === true,
      fresh: Date.now() - e.savedAt < PROFILE_TTL_MS,
    };
  } catch {
    return null;
  }
}

/** `touch` : repart pour 2 jours (données vraiment relues). Sinon la date d'origine est gardée. */
export async function writeProfileCache(
  botId: string,
  profile: BotProfile,
  languagesLoaded: boolean,
  savedAt: number = Date.now(),
): Promise<void> {
  try {
    const e: Entry = {v: 1, savedAt, languagesLoaded, profile};
    await cacheSetString(PREFIX + botId, JSON.stringify(e));
  } catch {
    // cache indisponible : sans conséquence
  }
}

export async function dropProfileCache(botId: string): Promise<void> {
  try {
    await cacheDelete(PREFIX + botId);
  } catch {
    // rien
  }
}

export async function clearProfileCache(): Promise<void> {
  try {
    await cacheDeleteByPrefix(PREFIX);
  } catch {
    // rien
  }
}
