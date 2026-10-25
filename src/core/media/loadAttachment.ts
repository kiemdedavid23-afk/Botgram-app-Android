/**
 * Télécharge un attachment (authedHttpBinary) → MediaStorage.
 * Une seule promesse en vol par messageId.
 */
import {fetchAttachment} from '../api/endpoints/messages';
import {arrayBufferToBase64} from '../utils/arrayBufferBase64';
import {getMediaStorage} from './MediaStorage';
import {ATTACHMENT_MAX_BYTES} from '../api/http';

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

async function doLoad(
  messageId: string,
  signal?: AbortSignal,
): Promise<LoadAttachmentResult> {
  const storage = getMediaStorage();
  if (await storage.exists(messageId)) {
    return {ok: true, path: storage.localPath(messageId)};
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
