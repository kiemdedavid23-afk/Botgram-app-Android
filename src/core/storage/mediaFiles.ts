/**
 * SEUL import de react-native-blob-util dans le dépôt.
 * Usage fs uniquement — jamais .fetch / .config / download / upload (R1).
 */
import ReactNativeBlobUtil from 'react-native-blob-util';

const fs = ReactNativeBlobUtil.fs;

/** Répertoire privé app pour les médias (sandbox). */
export function mediaRootDir(): string {
  return `${fs.dirs.DocumentDir}/botgram-media`;
}

export async function ensureMediaRoot(): Promise<string> {
  const root = mediaRootDir();
  const exists = await fs.exists(root);
  if (!exists) {
    await fs.mkdir(root);
  }
  return root;
}

export function mediaFilePath(messageId: string): string {
  // id dans le nom uniquement ; pas de jeton, pas de chemin utilisateur
  const safe = messageId.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `${mediaRootDir()}/${safe}`;
}

export async function mediaFileExists(messageId: string): Promise<boolean> {
  return fs.exists(mediaFilePath(messageId));
}

export async function mediaFileWrite(
  messageId: string,
  base64Data: string,
): Promise<string> {
  await ensureMediaRoot();
  const path = mediaFilePath(messageId);
  await fs.writeFile(path, base64Data, 'base64');
  return path;
}

export async function mediaFileReadBase64(
  messageId: string,
): Promise<string | null> {
  const path = mediaFilePath(messageId);
  if (!(await fs.exists(path))) return null;
  return fs.readFile(path, 'base64');
}

export async function mediaFileDelete(messageId: string): Promise<void> {
  const path = mediaFilePath(messageId);
  if (await fs.exists(path)) {
    await fs.unlink(path);
  }
}

export async function mediaFileSize(messageId: string): Promise<number> {
  const path = mediaFilePath(messageId);
  if (!(await fs.exists(path))) return 0;
  const stat = await fs.stat(path);
  return Number(stat.size) || 0;
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
}
