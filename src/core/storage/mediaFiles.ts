/**
 * SEUL import de react-native-blob-util dans le dépôt.
 * Usage fs (+ actionViewIntent Android) — jamais .fetch / .config / download.
 * Médias : fichiers `<id>.enc` (chiffrés) ; l'ancien clair `<id>` n'est lu que
 * pour la migration (voir core/crypto/mediaCipher.ts).
 */
import ReactNativeBlobUtil from 'react-native-blob-util';

const fs = ReactNativeBlobUtil.fs;

function safeName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, '_');
}

export function mediaRootDir(): string {
  return `${fs.dirs.DocumentDir}/botgram-media`;
}

export function mediaTempDir(): string {
  return `${fs.dirs.CacheDir}/botgram-media-tmp`;
}

async function ensureDir(dir: string): Promise<string> {
  if (!(await fs.exists(dir))) {
    await fs.mkdir(dir);
  }
  return dir;
}

export function ensureMediaRoot(): Promise<string> {
  return ensureDir(mediaRootDir());
}

export function ensureMediaTempDir(): Promise<string> {
  return ensureDir(mediaTempDir());
}

export function mediaFilePath(messageId: string): string {
  return `${mediaRootDir()}/${safeName(messageId)}.enc`;
}

/** Ancien chemin clair (migration uniquement). */
export function mediaPlainLegacyPath(messageId: string): string {
  return `${mediaRootDir()}/${safeName(messageId)}`;
}

export async function mediaFileExists(messageId: string): Promise<boolean> {
  if (await fs.exists(mediaFilePath(messageId))) {
    return true;
  }
  return fs.exists(mediaPlainLegacyPath(messageId));
}

export function mediaEncExists(messageId: string): Promise<boolean> {
  return fs.exists(mediaFilePath(messageId));
}

export async function mediaFileWriteEnc(
  messageId: string,
  base64Enc: string,
): Promise<string> {
  await ensureMediaRoot();
  const path = mediaFilePath(messageId);
  await fs.writeFile(path, base64Enc, 'base64');
  return path;
}

async function readBase64If(path: string): Promise<string | null> {
  if (!(await fs.exists(path))) {
    return null;
  }
  return fs.readFile(path, 'base64');
}

export function mediaFileReadEncBase64(
  messageId: string,
): Promise<string | null> {
  return readBase64If(mediaFilePath(messageId));
}

export function mediaFileReadLegacyBase64(
  messageId: string,
): Promise<string | null> {
  return readBase64If(mediaPlainLegacyPath(messageId));
}

async function unlinkIf(path: string): Promise<void> {
  if (await fs.exists(path)) {
    await fs.unlink(path);
  }
}

export async function mediaFileDelete(messageId: string): Promise<void> {
  await unlinkIf(mediaFilePath(messageId));
  await unlinkIf(mediaPlainLegacyPath(messageId));
}

export function mediaFileDeleteLegacyPlain(messageId: string): Promise<void> {
  return unlinkIf(mediaPlainLegacyPath(messageId));
}

async function sizeIf(path: string): Promise<number> {
  if (!(await fs.exists(path))) {
    return 0;
  }
  const st = await fs.stat(path);
  return Number(st.size) || 0;
}

export async function mediaFileSize(messageId: string): Promise<number> {
  const enc = await sizeIf(mediaFilePath(messageId));
  return enc > 0 ? enc : sizeIf(mediaPlainLegacyPath(messageId));
}

export async function mediaTotalSize(): Promise<number> {
  const root = mediaRootDir();
  if (!(await fs.exists(root))) {
    return 0;
  }
  const entries = await fs.ls(root);
  let total = 0;
  for (const name of entries) {
    total += await sizeIf(`${root}/${name}`);
  }
  return total;
}

/** Supprime tous les fichiers du dossier puis le dossier. */
async function clearDir(root: string, removeRoot: boolean): Promise<void> {
  if (!(await fs.exists(root))) {
    return;
  }
  const entries = await fs.ls(root);
  for (const name of entries) {
    await fs.unlink(`${root}/${name}`);
  }
  if (removeRoot) {
    try {
      await fs.unlink(root);
    } catch {
      // dossier déjà retiré
    }
  }
}

export function mediaClearAll(): Promise<void> {
  return clearDir(mediaRootDir(), true);
}

export async function mediaTempWrite(
  randomName: string,
  base64Data: string,
): Promise<string> {
  await ensureMediaTempDir();
  const path = `${mediaTempDir()}/${safeName(randomName)}`;
  await fs.writeFile(path, base64Data, 'base64');
  return path;
}

export function mediaTempDelete(path: string): Promise<void> {
  return unlinkIf(path);
}

export function mediaTempClearAll(): Promise<void> {
  return clearDir(mediaTempDir(), false);
}

// ---------------------------------------------------------------------------
// Ouverture par une app externe. Le fichier est déchiffré dans le dossier
// temporaire par le résolveur injecté (core/media/registerMediaCleaner.ts) ;
// core/storage ne dépend pas de core/crypto.
// Limite : le fichier temporaire reste lisible jusqu'à la prochaine purge.
// ---------------------------------------------------------------------------

export type MediaOpenResult = {ok: true} | {ok: false; code: string};
type PlainResolver = (messageId: string) => Promise<string>;

let plainResolver: PlainResolver | null = null;

export function setMediaPlainResolver(resolver: PlainResolver | null): void {
  plainResolver = resolver;
}

export async function openMediaFile(
  messageId: string,
  mime?: string | null,
): Promise<MediaOpenResult> {
  if (!plainResolver) {
    return {ok: false, code: 'not_found'};
  }
  let path: string;
  try {
    path = await plainResolver(messageId);
  } catch {
    return {ok: false, code: 'not_found'};
  }
  const type = mime && mime.length > 0 ? mime : 'application/octet-stream';
  try {
    await ReactNativeBlobUtil.android.actionViewIntent(path, type);
    return {ok: true};
  } catch {
    await unlinkIf(path);
    return {ok: false, code: 'no_handler'};
  }
}

// ---------------------------------------------------------------------------
// Photos de profil des bots (cache de 2 jours, voir core/media/botPhotoCache.ts).
// Dossier séparé de botgram-media : « vider les médias » ne les touche pas.
// ---------------------------------------------------------------------------

function botPhotoRoot(): string {
  return `${fs.dirs.DocumentDir}/botgram-botphotos`;
}

/** URI `file://` utilisable directement par <Image>. */
export function botPhotoFileUri(name: string): string {
  return `file://${botPhotoRoot()}/${safeName(name)}`;
}

export function botPhotoFileExists(name: string): Promise<boolean> {
  return fs.exists(`${botPhotoRoot()}/${safeName(name)}`);
}

export async function botPhotoFileWrite(
  name: string,
  base64Data: string,
): Promise<void> {
  const root = await ensureDir(botPhotoRoot());
  await fs.writeFile(`${root}/${safeName(name)}`, base64Data, 'base64');
}

export function botPhotoFileDelete(name: string): Promise<void> {
  return unlinkIf(`${botPhotoRoot()}/${safeName(name)}`);
}

/** Supprime toutes les photos de bots (déconnexion du membre). */
export function botPhotoClearAll(): Promise<void> {
  return clearDir(botPhotoRoot(), true);
}
