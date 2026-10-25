/**
 * Télécharge un attachment (httpBinary) et le stocke via MediaStorage.
 */
import {fetchAttachment} from '../api/endpoints/messages';
import {getAccessToken} from '../storage';
import {arrayBufferToBase64} from '../utils/arrayBufferBase64';
import {getMediaStorage} from './MediaStorage';
import {ATTACHMENT_MAX_BYTES} from '../api/http';

export type LoadAttachmentResult =
  | {ok: true; path: string}
  | {ok: false; code: string; message: string};

export async function loadAttachmentToStorage(
  messageId: string,
  signal?: AbortSignal,
): Promise<LoadAttachmentResult> {
  const storage = getMediaStorage();
  if (await storage.exists(messageId)) {
    return {ok: true, path: storage.localPath(messageId)};
  }
  const token = await getAccessToken();
  const res = await fetchAttachment(messageId, token, signal);
  if (!res.ok) {
    return {
      ok: false,
      code: res.error.code,
      message: res.error.message,
    };
  }
  if (res.data.byteLength > ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      code: 'PAYLOAD_TOO_LARGE',
      message: 'Fichier trop volumineux',
    };
  }
  const b64 = arrayBufferToBase64(res.data);
  try {
    const path = await storage.writeBase64(messageId, b64);
    return {ok: true, path};
  } catch {
    return {
      ok: false,
      code: 'storage_full',
      message: 'Espace de stockage insuffisant',
    };
  }
}
