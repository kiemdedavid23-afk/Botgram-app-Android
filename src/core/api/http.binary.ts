/**
 * Lecture binaire — réutilise executeFetch (pas de second fetch).
 */
import {
  executeFetch,
  type HttpFailure,
  type HttpRequestOptions,
  ATTACHMENT_MAX_BYTES,
} from './http';

export type HttpBinarySuccess = {
  ok: true;
  data: ArrayBuffer;
  status: number;
  headers: Headers;
  requestId: string | null;
};

export type HttpBinaryResult = HttpBinarySuccess | HttpFailure;

export async function httpBinary(
  options: Omit<HttpRequestOptions, 'body'>,
): Promise<HttpBinaryResult> {
  const raw = await executeFetch({
    ...options,
    timeoutMs: options.timeoutMs ?? 60_000,
  });
  if (!raw.ok) return raw;
  const {response, requestId} = raw;
  const cl = response.headers.get('content-length');
  if (cl !== null) {
    const n = Number(cl);
    if (!Number.isNaN(n) && n > ATTACHMENT_MAX_BYTES) {
      return {
        ok: false,
        error: {code: 'PAYLOAD_TOO_LARGE', message: 'Fichier trop volumineux'},
        requestId,
        status: 413,
        headers: response.headers,
      };
    }
  }
  if (response.status < 200 || response.status >= 300) {
    return {
      ok: false,
      error: {
        code: `http_${response.status}`,
        message: `Erreur HTTP ${response.status}`,
      },
      requestId,
      status: response.status,
      headers: response.headers,
    };
  }
  const buf = await response.arrayBuffer();
  if (buf.byteLength > ATTACHMENT_MAX_BYTES) {
    return {
      ok: false,
      error: {code: 'PAYLOAD_TOO_LARGE', message: 'Fichier trop volumineux'},
      requestId,
      status: 413,
      headers: response.headers,
    };
  }
  return {
    ok: true,
    data: buf,
    status: response.status,
    headers: response.headers,
    requestId,
  };
}
