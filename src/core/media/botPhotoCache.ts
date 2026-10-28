/**
 * Cache disque de la photo de profil des bots — durée de vie : 2 jours.
 *  - un fichier par bot (nom horodaté : l'URI change à chaque nouvelle photo,
 *    donc <Image> ne montre jamais l'ancienne version) ;
 *  - une fiche dans le cache chiffré (MMKV) : date d'enregistrement + nom du fichier
 *    (`file: null` = le bot n'a pas de photo, on s'en souvient aussi 2 jours).
 * Pas de logique d'affichage ici : voir shared/botPhoto/botPhotoStore.ts.
 */
import {
  cacheGetString,
  cacheSetString,
  cacheDelete,
  cacheDeleteByPrefix,
} from '../storage';
import {
  botPhotoFileUri,
  botPhotoFileExists,
  botPhotoFileWrite,
  botPhotoFileDelete,
  botPhotoClearAll,
} from '../storage/mediaFiles';
import {getBotPhotoBinary} from '../api/endpoints/botPhoto';
import {arrayBufferToBase64} from '../utils/arrayBufferBase64';

export const BOT_PHOTO_TTL_MS = 2 * 24 * 60 * 60 * 1000;

const KEY_PREFIX = 'botphoto.';

type Meta = {v: 1; savedAt: number; file: string | null};

export type CachedBotPhoto = {
  /** null = le bot n'a pas de photo. */
  uri: string | null;
  savedAt: number;
  /** true tant que la fiche a moins de 2 jours. */
  fresh: boolean;
};

export type DownloadBotPhotoResult =
  | {ok: true; uri: string | null}
  | {ok: false; code: string};

function metaKey(botId: string): string {
  return `${KEY_PREFIX}${botId}`;
}

async function readMeta(botId: string): Promise<Meta | null> {
  try {
    const raw = await cacheGetString(metaKey(botId));
    if (!raw) return null;
    const m = JSON.parse(raw) as Partial<Meta>;
    if (m.v !== 1 || typeof m.savedAt !== 'number') return null;
    return {v: 1, savedAt: m.savedAt, file: m.file ?? null};
  } catch {
    return null;
  }
}

async function writeMeta(botId: string, meta: Meta): Promise<void> {
  try {
    await cacheSetString(metaKey(botId), JSON.stringify(meta));
  } catch {
    // cache indisponible : la photo s'affichera quand même cette fois
  }
}

/** Lit le cache. null = rien d'exploitable (absent, ou fichier disparu). */
export async function readBotPhotoCache(
  botId: string,
): Promise<CachedBotPhoto | null> {
  const meta = await readMeta(botId);
  if (!meta) return null;
  const fresh = Date.now() - meta.savedAt < BOT_PHOTO_TTL_MS;
  if (meta.file === null) return {uri: null, savedAt: meta.savedAt, fresh};
  try {
    if (!(await botPhotoFileExists(meta.file))) return null;
  } catch {
    return null;
  }
  return {uri: botPhotoFileUri(meta.file), savedAt: meta.savedAt, fresh};
}

/** Télécharge la photo et remplace le cache (l'ancien fichier est supprimé). */
export async function downloadBotPhoto(
  botId: string,
): Promise<DownloadBotPhotoResult> {
  const res = await getBotPhotoBinary(botId);
  const prev = await readMeta(botId);

  if (!res.ok) {
    if (res.status === 404) {
      if (prev?.file) await safeDelete(prev.file);
      await writeMeta(botId, {v: 1, savedAt: Date.now(), file: null});
      return {ok: true, uri: null};
    }
    return {ok: false, code: res.error.code};
  }

  const file = `${botId}-${Date.now()}.jpg`;
  try {
    await botPhotoFileWrite(file, arrayBufferToBase64(res.data));
  } catch {
    return {ok: false, code: 'storage_full'};
  }
  await writeMeta(botId, {v: 1, savedAt: Date.now(), file});
  if (prev?.file && prev.file !== file) await safeDelete(prev.file);
  return {ok: true, uri: botPhotoFileUri(file)};
}

/** Photo supprimée côté bot : on garde « pas de photo » 2 jours, sans réseau. */
export async function markBotPhotoRemoved(botId: string): Promise<void> {
  const prev = await readMeta(botId);
  if (prev?.file) await safeDelete(prev.file);
  await writeMeta(botId, {v: 1, savedAt: Date.now(), file: null});
}

/** Oublie la photo d'un bot (bot supprimé / déconnecté). */
export async function dropBotPhoto(botId: string): Promise<void> {
  const prev = await readMeta(botId);
  if (prev?.file) await safeDelete(prev.file);
  try {
    await cacheDelete(metaKey(botId));
  } catch {
    // rien à supprimer
  }
}

/** Efface tout (déconnexion du membre). */
export async function clearBotPhotoCache(): Promise<void> {
  try {
    await cacheDeleteByPrefix(KEY_PREFIX);
  } catch {
    // ignoré
  }
  try {
    await botPhotoClearAll();
  } catch {
    // ignoré
  }
}

async function safeDelete(file: string): Promise<void> {
  try {
    await botPhotoFileDelete(file);
  } catch {
    // fichier déjà absent
  }
}
