/**
 * Enregistrement du jeton FCM auprès du Worker, désenregistrement avant la
 * déconnexion. Les erreurs réseau ne bloquent jamais l'application : le
 * message n'est jamais perdu (l'app relit /updates).
 */
import {Platform} from 'react-native';
import {registerPushToken, unregisterPushToken} from '../api/endpoints/push';
import {cacheGetNumber, cacheSetNumber} from '../storage';
import {registerMemberDataCleaner} from '../utils/memberData';
import {fireAndForget} from '../utils/fireAndForget';
import {
  deletePushToken,
  ensureChannels,
  getPushToken,
  hasNotificationPermission,
  onPushTokenRefresh,
  requestNotificationPermission,
} from './pushClient';
import {PUSH_DEVICE_PREFIX} from './pushConfig';

const ASKED_KEY = 'push.permissionAsked';

let registeredToken: string | null = null;

registerMemberDataCleaner(() => {
  registeredToken = null;
});

function deviceLabel(): string {
  return `${PUSH_DEVICE_PREFIX} ${String(Platform.Version)}`;
}

async function sendToken(token: string): Promise<void> {
  if (token === registeredToken) return;
  const res = await registerPushToken(token, deviceLabel());
  if (res.ok) registeredToken = token;
}

/**
 * Canaux + permission (demandée une seule fois par installation) + jeton.
 * Sans permission, rien n'est enregistré.
 */
export async function setupPush(): Promise<boolean> {
  await ensureChannels();
  let allowed = await hasNotificationPermission();
  if (!allowed && (await cacheGetNumber(ASKED_KEY)) == null) {
    await cacheSetNumber(ASKED_KEY, 1);
    allowed = await requestNotificationPermission();
  }
  if (!allowed) return false;
  await sendToken(await getPushToken());
  return true;
}

/** Renvoie le nouveau jeton quand Firebase en génère un. */
export function watchTokenRefresh(): () => void {
  return onPushTokenRefresh(token => {
    registeredToken = null;
    fireAndForget(sendToken(token));
  });
}

/**
 * Avant la déconnexion : le Worker oublie ce jeton, puis le jeton local est
 * détruit (un nouveau sera créé à la prochaine connexion).
 */
export async function unregisterPush(): Promise<void> {
  if (registeredToken == null) return;
  await unregisterPushToken(registeredToken);
  registeredToken = null;
  await deletePushToken();
}
