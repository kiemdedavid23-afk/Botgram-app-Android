/** Notifications push (PUSH.md) : enregistrement du jeton FCM de l'appareil. */
import {authedHttp, type HttpResult} from '../session';

/** POST /push/register — 5 appareils au plus par membre, 30 par heure. */
export async function registerPushToken(
  token: string,
  device: string,
): Promise<HttpResult<{registered: boolean}>> {
  return authedHttp<{registered: boolean}>({
    method: 'POST',
    path: '/push/register',
    body: {token, platform: 'fcm', device},
  });
}

/** POST /push/unregister — à appeler avant la déconnexion. */
export async function unregisterPushToken(
  token: string,
): Promise<HttpResult<{removed: boolean}>> {
  return authedHttp<{removed: boolean}>({
    method: 'POST',
    path: '/push/unregister',
    body: {token},
  });
}
