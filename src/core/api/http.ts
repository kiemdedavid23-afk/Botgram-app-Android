/**
 * SEUL `fetch` du dépôt (R1).
 * - credentials: 'omit' (pas de cookie, pas d'Origin → CSRF OK)
 * - En-têtes X-App-* sur toutes les requêtes
 * - Pas d'en-tête Origin
 * - fetch ne lève jamais (réseau, timeout, abort, lecture corps)
 */
import {env} from '../config/env';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export type HttpRequestOptions = {
  method?: HttpMethod;
  path: string;
  body?: unknown;
  headers?: Record<string, string>;
  /** Access token (Bearer). Ne jamais loguer. */
  accessToken?: string | null;
  /** X-Token-Mode: body uniquement sur verify/refresh */
  tokenModeBody?: boolean;
  signal?: AbortSignal;
  /** Timeout en ms (défaut 30000) */
  timeoutMs?: number;
};

export type HttpSuccess<T> = {
  ok: true;
  data: T;
  requestId: string | null;
  status: number;
  headers: Headers;
};

export type HttpErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export type HttpFailure = {
  ok: false;
  error: HttpErrorBody;
  requestId: string | null;
  status: number;
  headers: Headers;
  /** Corps brut si non-JSON */
  raw?: string;
};

export type HttpResult<T> = HttpSuccess<T> | HttpFailure;

function buildUrl(path: string): string {
  const base = env.apiUrl.replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}${p}`;
}

function baseHeaders(options: HttpRequestOptions): Record<string, string> {
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-App-Platform': env.platform,
    'X-App-Channel': env.appChannel,
    'X-App-Build': String(env.appBuild),
    'X-App-Version': env.appVersion,
  };

  if (options.body !== undefined && !(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  if (options.tokenModeBody) {
    headers['X-Token-Mode'] = 'body';
  }

  if (options.headers) {
    for (const [k, v] of Object.entries(options.headers)) {
      if (k.toLowerCase() === 'origin') {
        continue;
      }
      headers[k] = v;
    }
  }

  return headers;
}

function statusToErrorCode(status: number): string {
  if (status === 401) return 'http_401';
  if (status === 429) return 'http_429';
  if (status >= 500) return 'http_5xx';
  if (status >= 400) return `http_${status}`;
  return 'unexpected_response';
}

/**
 * Point d'entrée HTTP unique. Aucun autre fichier ne doit appeler fetch.
 */
export async function http<T>(options: HttpRequestOptions): Promise<HttpResult<T>> {
  if (options.signal?.aborted) {
    return {
      ok: false,
      error: {code: 'aborted', message: 'Requête annulée'},
      requestId: null,
      status: 0,
      headers: new Headers(),
    };
  }

  const url = buildUrl(options.path);
  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  const headers = baseHeaders(options);

  let body: string | FormData | null | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const onCallerAbort = () => controller.abort();
  if (options.signal) {
    options.signal.addEventListener('abort', onCallerAbort);
  }

  let response: Response | undefined;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'omit',
      signal: controller.signal,
    });

    const requestId = response.headers.get('x-request-id');
    const text = await response.text();

    const isEmpty = text.length === 0 || response.headers.get('content-length') === '0';

    if (isEmpty) {
      if (response.status >= 200 && response.status < 300) {
        return {
          ok: true,
          data: null as unknown as T,
          requestId,
          status: response.status,
          headers: response.headers,
        };
      }
      return {
        ok: false,
        error: {
          code: statusToErrorCode(response.status),
          message: `Erreur HTTP ${response.status}`,
        },
        requestId,
        status: response.status,
        headers: response.headers,
      };
    }

    let parsed: unknown = null;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      return {
        ok: false,
        error: {code: 'invalid_json', message: 'Réponse non JSON'},
        requestId,
        status: response.status,
        headers: response.headers,
        raw: text.slice(0, 500),
      };
    }

    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'ok' in parsed &&
      (parsed as {ok: unknown}).ok === true &&
      'data' in parsed
    ) {
      const p = parsed as {ok: true; data: T; request_id?: string};
      return {
        ok: true,
        data: p.data,
        requestId: p.request_id ?? requestId,
        status: response.status,
        headers: response.headers,
      };
    }

    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'ok' in parsed &&
      (parsed as {ok: unknown}).ok === false &&
      'error' in parsed
    ) {
      const p = parsed as {ok: false; error: HttpErrorBody; request_id?: string};
      return {
        ok: false,
        error: p.error,
        requestId: p.request_id ?? requestId,
        status: response.status,
        headers: response.headers,
      };
    }

    return {
      ok: false,
      error: {
        code: response.status === 426 ? 'UPGRADE_REQUIRED' : statusToErrorCode(response.status),
        message: 'Réponse inattendue du serveur',
      },
      requestId,
      status: response.status,
      headers: response.headers,
      raw: text.slice(0, 500),
    };
  } catch (err) {
    const isAbort = err instanceof Error && (err.name === 'AbortError' || controller.signal.aborted);
    const code = isAbort ? (options.signal?.aborted ? 'aborted' : 'timeout') : 'network_error';
    return {
      ok: false,
      error: {
        code,
        message: code === 'timeout' ? 'Délai dépassé' : code === 'aborted' ? 'Requête annulée' : 'Erreur réseau',
      },
      requestId: null,
      status: 0,
      headers: response?.headers ?? new Headers(),
    };
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', onCallerAbort);
    }
  }
}


/** Limite M7 / Worker attachment (~20 Mo). */
export const ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export type HttpBinarySuccess = {
  ok: true;
  data: ArrayBuffer;
  status: number;
  headers: Headers;
  requestId: string | null;
};

export type HttpBinaryResult = HttpBinarySuccess | HttpFailure;

/**
 * GET binaire (même fetch R1). Pour GET /messages/:id/attachment.
 * Refuse si Content-Length > ATTACHMENT_MAX_BYTES.
 */
export async function httpBinary(
  options: Omit<HttpRequestOptions, 'body'>,
): Promise<HttpBinaryResult> {
  if (options.signal?.aborted) {
    return {
      ok: false,
      error: {code: 'aborted', message: 'Requête annulée'},
      requestId: null,
      status: 0,
      headers: new Headers(),
    };
  }
  const url = buildUrl(options.path);
  const headers = baseHeaders({...options, body: undefined});
  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 60000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const onCallerAbort = () => controller.abort();
  if (options.signal) {
    options.signal.addEventListener('abort', onCallerAbort);
  }
  let response: Response | undefined;
  try {
    response = await fetch(url, {
      method: options.method ?? 'GET',
      headers,
      credentials: 'omit',
      signal: controller.signal,
    });
    const requestId = response.headers.get('x-request-id');
    const cl = response.headers.get('content-length');
    if (cl !== null) {
      const n = Number(cl);
      if (!Number.isNaN(n) && n > ATTACHMENT_MAX_BYTES) {
        return {
          ok: false,
          error: {
            code: 'PAYLOAD_TOO_LARGE',
            message: 'Fichier trop volumineux',
          },
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
          code: statusToErrorCode(response.status),
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
        error: {
          code: 'PAYLOAD_TOO_LARGE',
          message: 'Fichier trop volumineux',
        },
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
  } catch (err) {
    const isAbort =
      err instanceof Error &&
      (err.name === 'AbortError' || controller.signal.aborted);
    const code = isAbort
      ? options.signal?.aborted
        ? 'aborted'
        : 'timeout'
      : 'network_error';
    return {
      ok: false,
      error: {
        code,
        message:
          code === 'timeout'
            ? 'Délai dépassé'
            : code === 'aborted'
              ? 'Requête annulée'
              : 'Erreur réseau',
      },
      requestId: null,
      status: 0,
      headers: response?.headers ?? new Headers(),
    };
  } finally {
    clearTimeout(timeoutId);
    if (options.signal) {
      options.signal.removeEventListener('abort', onCallerAbort);
    }
  }
}
