/**
 * SEUL `fetch` du dépôt (R1).
 * - credentials: 'omit' (pas de cookie, pas d'Origin → CSRF OK)
 * - En-têtes X-App-* sur toutes les requêtes
 * - Pas d'en-tête Origin
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
        // Refuse explicitement tout Origin (contrat CSRF)
        continue;
      }
      headers[k] = v;
    }
  }

  return headers;
}

/**
 * Point d'entrée HTTP unique. Aucun autre fichier ne doit appeler fetch.
 */
export async function http<T>(options: HttpRequestOptions): Promise<HttpResult<T>> {
  const url = buildUrl(options.path);
  const method = options.method ?? (options.body !== undefined ? 'POST' : 'GET');
  const headers = baseHeaders(options);

  let body: BodyInit | undefined;
  if (options.body instanceof FormData) {
    body = options.body;
  } else if (options.body !== undefined) {
    body = JSON.stringify(options.body);
  }

  const controller = new AbortController();
  const timeout = options.timeoutMs ?? 30000;
  const timeoutId = setTimeout(() => controller.abort(), timeout);
  const signal = options.signal
    ? (() => {
        options.signal!.addEventListener('abort', () => controller.abort());
        return controller.signal;
      })()
    : controller.signal;

  let response: Response;
  try {
    response = await fetch(url, {
      method,
      headers,
      body,
      credentials: 'omit',
      signal,
    });
  } catch (err) {
    clearTimeout(timeoutId);
    const isAbort = err instanceof Error && (err.name === 'AbortError' || controller.signal.aborted);
    const code = isAbort ? (options.signal?.aborted ? 'aborted' : 'timeout') : 'network_error';
    return {
      ok: false,
      error: {code, message: code === 'timeout' ? 'Délai dépassé' : 'Erreur réseau'},
      requestId: null,
      status: 0,
      headers: new Headers(),
    };
  }
  clearTimeout(timeoutId);

  // Succès sans corps (202/204)
  if (response.status === 202 || response.status === 204 || response.headers.get('content-length') === '0') {
    return {
      ok: true,
      data: null as unknown as T,
      requestId: response.headers.get('x-request-id'),
      status: response.status,
      headers: response.headers,
    };
  }

  const requestId = response.headers.get('x-request-id');
  const text = await response.text();
  let parsed: unknown = null;
  if (text.length > 0) {
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
      code: response.status === 426 ? 'UPGRADE_REQUIRED' : 'unexpected_response',
      message: 'Réponse inattendue du serveur',
    },
    requestId,
    status: response.status,
    headers: response.headers,
    raw: text.slice(0, 500),
  };
}
