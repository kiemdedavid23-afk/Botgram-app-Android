/**
 * Nom et type des fichiers à télécharger, pour la notification Android de téléchargement
 * (nom du fichier, « Photo » / « Vidéo » / « Message vocal »…, barre de progression).
 * Les bulles de messages les enregistrent ; loadAttachment les envoie au module natif.
 */
import {NativeModules} from 'react-native';

type Meta = {kind: string; name?: string | null};

const MAX_ENTRIES = 500;
const metas = new Map<string, Meta>();

/** Retient le type (photo, video, audio, voice, document…) et le nom d'un message. */
export function rememberDownloadMeta(
  messageId: string,
  kind: string,
  name?: string | null,
): void {
  if (metas.size >= MAX_ENTRIES && !metas.has(messageId)) {
    const oldest = metas.keys().next().value;
    if (oldest !== undefined) metas.delete(oldest);
  }
  metas.set(messageId, {kind, name});
}

export function getDownloadMeta(messageId: string): Meta | undefined {
  return metas.get(messageId);
}

type DescribeModule = {
  describe?: (id: string, label: string, kind: string) => void;
};

/** Donne au module natif le nom et le type affichés dans la notification (sans effet si absent). */
export function describeDownload(messageId: string): void {
  const m = getDownloadMeta(messageId);
  const mod = NativeModules.BotgramDownload as DescribeModule | undefined;
  try {
    mod?.describe?.(messageId, m?.name ?? '', m?.kind ?? '');
  } catch {
    // la notification est un confort : jamais bloquant
  }
}
