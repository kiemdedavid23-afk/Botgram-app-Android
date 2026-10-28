/**
 * Écritures photo de profil d'un bot.
 * ⚠ Routes à confirmer avec le contrat Worker (absent du dépôt) :
 *   DELETE /bots/:id/photo
 *   POST   /bots/:id/photo  (multipart, champ « photo »)
 * La lecture (GET /bots/:id/photo) est dans botProfileRead.ts.
 */
import {authedHttp, authedHttpBinary, type HttpResult} from '../session';
import type {HttpBinaryResult} from '../http.binary';

export async function deleteBotPhoto(
  botId: string,
): Promise<HttpResult<{deleted?: boolean}>> {
  return authedHttp<{deleted?: boolean}>({
    method: 'DELETE',
    path: `/bots/${botId}/photo`,
  });
}

export async function setBotPhoto(
  botId: string,
  form: FormData,
): Promise<HttpResult<{updated?: boolean}>> {
  return authedHttp<{updated?: boolean}>({
    method: 'POST',
    path: `/bots/${botId}/photo`,
    body: form,
    timeoutMs: 60_000,
  });
}

/**
 * GET /bots/:id/photo — octets de l'image (jeton + refresh 401 gérés par authedHttpBinary).
 * 404 = le bot n'a pas de photo.
 */
export async function getBotPhotoBinary(
  botId: string,
): Promise<HttpBinaryResult> {
  return authedHttpBinary({
    method: 'GET',
    path: `/bots/${botId}/photo`,
    timeoutMs: 60_000,
  });
}
