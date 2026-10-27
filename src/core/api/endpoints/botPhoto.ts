/**
 * Écritures photo de profil d'un bot.
 * ⚠ Routes à confirmer avec le contrat Worker (absent du dépôt) :
 *   DELETE /bots/:id/photo
 *   POST   /bots/:id/photo  (multipart, champ « photo »)
 * La lecture (GET /bots/:id/photo) est dans botProfileRead.ts.
 */
import {authedHttp, type HttpResult} from '../session';

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
