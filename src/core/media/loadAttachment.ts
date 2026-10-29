/**
 * Télécharge un attachment → MediaStorage.
 * Chemin principal : téléchargement NATIF direct vers le disque (module Kotlin BotgramDownload,
 * sans base64 en mémoire JS). Repli : ancien chemin authedHttpBinary + base64 — utilisé quand le
 * module natif est absent (tests) ou quand le jeton a expiré (401 : le repli rafraîchit la session).
 * Une seule promesse en vol par messageId.
 */
import {fetchAttachment} from '../api/endpoints/messages';
import {arrayBufferToBase64} from '../utils/arrayBufferBase64';
import {getMediaStorage} from './MediaStorage';
import {ATTACHMENT_MAX_BYTES} from '../api/http';
import {env} from '../config/env';
import {getAccessToken} from '../storage';
import {isNativeDownloadAvailable, nativeDownload} from './native/nativeMedia';
import {describeDownload} from './downloadMeta';

export type LoadAttachmentResult =
  | {ok: true; path: string}
  | {ok: false; code: string; message: string};

const inflight = new Map<string, Promise<LoadAttachmentResult>>();

export async function loadAttachmentToStorage(
  messageId: string,
  signal?: AbortSignal,
): Promise<LoadAttachmentResult> {
  const existing = inflight.get(messageId);
  if (existing) return existing;

  const job = doLoad(messageId, signal).finally(() => {
    inflight.delete(messageId);
  });
  inflight.set(messageId, job);
  return job;
}

/** Codes pour lesquels on retente par l'ancien chemin (qui sait rafraîchir le jeton). */
const FALLBACK_CODES = new Set(['http_401', 'native_unavailable']);

async function doLoadNative(
  messageId: string,
  destPath: string,
  signal?: AbortSignal,
): Promise<LoadAttachmentResult | null> {
  const access = await getAccessToken();
  const headers: Record<string, string> = {
    Accept: '*/*',
    'X-App-Platform': env.platform,
    'X-App-Channel': env.appChannel,
    'X-App-Build': String(env.appBuild),
    'X-App-Version': env.appVersion,
  };
  if (access) headers.Authorization = `Bearer ${access}`;

  const url = `${env.apiUrl.replace(/\/$/, '')}/messages/${messageId}/attachment`;
  // Nom et type du fichier pour la notification de téléchargement (barre + pourcentage).
  describeDownload(messageId);
  const res = await nativeDownload({
    id: messageId,
    url,
    destPath,
    headers,
    maxBytes: ATTACHMENT_MAX_BYTES,
    signal,
  });
  if (res.ok) return {ok: true, path: res.path};
  if (FALLBACK_CODES.has(res.code)) return null;
  return {ok: false, code: res.code, message: res.message};
}

async function doLoad(
  messageId: string,
  signal?: AbortSignal,
): Promise<LoadAttachmentResult> {
  const storage = getMediaStorage();
  if (await storage.exists(messageId)) {
    return {ok: true, path: storage.localPath(messageId)};
  }

  if (isNativeDownloadAvailable()) {
    const native = await doLoadNative(messageId, storage.localPath(messageId), signal);
    if (native) return native;
  }

  const res = await fetchAttachment(messageId, signal);
  if (!res.ok) {
    return {ok: false, code: res.error.code, message: res.error.message};
  }
  if (res.data.byteLength > ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Fichier trop volumineux',
    };
  }
  try {
    const path = await storage.writeBase64(
      messageId,
      arrayBufferToBase64(res.data),
    );
    return {ok: true, path};
  } catch {
    return {
      ok: false,
      code: 'storage_full',
      message: 'Espace de stockage insuffisant',
    };
  }
}

/** Tests : nombre d'entrées en vol. */
export function inflightCountForTests(): number {
  return inflight.size;
}
