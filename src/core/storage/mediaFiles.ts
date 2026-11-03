/**
 * SEUL import de react-native-blob-util dans le dépôt.
 * Usage fs (+ actionViewIntent Android) — jamais .fetch / .config / download.
 */
import ReactNativeBlobUtil from 'react-native-blob-util';

const fs = ReactNativeBlobUtil.fs;

export function mediaRootDir(): string {
  return `${fs.dirs.DocumentDir}/botgram-media`;
}

export function mediaTempDir(): string {
  return `${fs.dirs.CacheDir}/botgram-media-tmp`;
}

export async function ensureMediaRoot(): Promise<string> {
  const root = mediaRootDir();
  if (!(await fs.exists(root))) {
    await fs.mkdir(root);
  }
  return root;
}

export async function ensureMediaTempDir(): Promise<string> {
  const root = mediaTempDir();
  if (!(await fs.exists(root))) {
    await fs.mkdir(root);
  }
  return root;
}

export function mediaFilePath(messageId: string): string {
  const safe = messageId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${mediaRootDir()}/${safe}.enc`;
}

/** Ancien chemin clair (migration). */
export function mediaPlainLegacyPath(messageId: string): string {
  const safe = messageId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${mediaRootDir()}/${safe}`;
}

export async function mediaFileExists(messageId: string): Promise<boolean> {
  if (await fs.exists(mediaFilePath(messageId))) return true;
  return fs.exists(mediaPlainLegacyPath(messageId));
}

export async function mediaEncExists(messageId: string): Promise<boolean> {
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

export async function mediaFileReadEncBase64(
  messageId: string,
): Promise<string | null> {
  const path = mediaFilePath(messageId);
  if (!(await fs.exists(path))) return null;
  return fs.readFile(path, 'base64');
}

export async function mediaFileReadLegacyBase64(
  messageId: string,
): Promise<string | null> {
  const path = mediaPlainLegacyPath(messageId);
  if (!(await fs.exists(path))) return null;
  return fs.readFile(path, 'base64');
}

export async function mediaFileDelete(messageId: string): Promise<void> {
  const enc = mediaFilePath(messageId);
  if (await fs.exists(enc)) await fs.unlink(enc);
  const plain = mediaPlainLegacyPath(messageId);
  if (await fs.exists(plain)) await fs.unlink(plain);
}

export async function mediaFileDeleteLegacyPlain(
  messageId: string,
): Promise<void> {
  const plain = mediaPlainLegacyPath(messageId);
  if (await fs.exists(plain)) await fs.unlink(plain);
}

export async function mediaFileSize(messageId: string): Promise<number> {
  const enc = mediaFilePath(messageId);
  if (await fs.exists(enc)) {
    const st = await fs.stat(enc);
    return Number(st.size) || 0;
  }
  const plain = mediaPlainLegacyPath(messageId);
  if (await fs.exists(plain)) {
    const st = await fs.stat(plain);
    return Number(st.size) || 0;
  }
  return 0;
}

export async function mediaTotalSize(): Promise<number> {
  const root = mediaRootDir();
  if (!(await fs.exists(root))) return 0;
  const entries = await fs.ls(root);
  let total = 0;
  for (const name of entries) {
    const st = await fs.stat(`${root}/${name}`);
    total += Number(st.size) || 0;
  }
  return total;
}

export async function mediaClearAll(): Promise<void> {
  const root = mediaRootDir();
  if (!(await fs.exists(root))) return;
  const entries = await fs.ls(root);
  for (const name of entries) {
    await fs.unlink(`${root}/${name}`);
  }
  try {
    await fs.unlink(root);
  } catch {
    /* dossier déjà vide */
  }
}

export async function mediaTempWrite(
  randomName: string,
  base64Data: string,
): Promise<string> {
  await ensureMediaTempDir();
  const path = `${mediaTempDir()}/${randomName}`;
  await fs.writeFile(path, base64Data, 'base64');
  return path;
}

export async function mediaTempDelete(path: string): Promise<void> {
  if (await fs.exists(path)) {
    await fs.unlink(path);
  }
}

export async function mediaTempClearAll(): Promise<void> {
  const root = mediaTempDir();
  if (!(await fs.exists(root))) return;
  const entries = await fs.ls(root);
  for (const name of entries) {
    await fs.unlink(`${root}/${name}`);
  }
}

/**
 * Ouvre le fichier local avec une app externe (Android).
 * Limite : le fichier temp peut rester lisible jusqu'à la prochaine purge.
 */
export async function openMediaFile(
  localPath: string,
  mime?: string,
): Promise<void> {
  await ReactNativeBlobUtil.android.actionViewIntent(
    localPath,
    mime ?? 'application/octet-stream',
  );
}
