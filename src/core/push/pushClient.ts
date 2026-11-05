/**
 * Seul module qui importe Firebase Messaging et Notifee (comme blob-util pour
 * les médias). v26 de Firebase : API modulaire uniquement.
 */
import {PermissionsAndroid, Platform} from 'react-native';
import notifee, {AndroidImportance} from '@notifee/react-native';
import {
  getMessaging,
  getToken,
  deleteToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  setBackgroundMessageHandler,
  subscribeToTopic,
  unsubscribeFromTopic,
} from '@react-native-firebase/messaging';
import {parsePushData, type PushPayload} from './pushPayload';
import {PUSH_CHANNELS, ANDROID_NOTIFICATION_PERMISSION_API} from './pushConfig';

type RemoteLike = {data?: unknown} | null;

const noop = (): void => undefined;

/**
 * Sans services Google (build de test, appareil sans Play Services), les
 * appels natifs peuvent échouer : le push est alors désactivé, jamais l'app.
 */
function safeListener(subscribe: () => () => void): () => void {
  try {
    return subscribe();
  } catch {
    return noop;
  }
}

const toPayload = (m: RemoteLike): PushPayload | null =>
  m ? parsePushData(m.data) : null;

/** Canaux Android : `messages` (importance haute) et `updates`. */
export async function ensureChannels(): Promise<void> {
  await notifee.createChannel({
    id: PUSH_CHANNELS.messages.id,
    name: PUSH_CHANNELS.messages.name,
    importance: AndroidImportance.HIGH,
  });
  await notifee.createChannel({
    id: PUSH_CHANNELS.updates.id,
    name: PUSH_CHANNELS.updates.name,
    importance: AndroidImportance.DEFAULT,
  });
}

/** Android 13+ : POST_NOTIFICATIONS. Avant : toujours autorisé. */
export async function hasNotificationPermission(): Promise<boolean> {
  if (Number(Platform.Version) < ANDROID_NOTIFICATION_PERMISSION_API) {
    return true;
  }
  return PermissionsAndroid.check(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
}

export async function requestNotificationPermission(): Promise<boolean> {
  if (await hasNotificationPermission()) return true;
  const res = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
  );
  return res === PermissionsAndroid.RESULTS.GRANTED;
}

export async function getPushToken(): Promise<string> {
  return getToken(getMessaging());
}

export async function deletePushToken(): Promise<void> {
  await deleteToken(getMessaging());
}

export function onPushTokenRefresh(cb: (token: string) => void): () => void {
  return safeListener(() => onTokenRefresh(getMessaging(), cb));
}

/** Notification reçue application ouverte. */
export function onForegroundPush(cb: (p: PushPayload) => void): () => void {
  return safeListener(() =>
    onMessage(getMessaging(), async m => {
      const p = toPayload(m);
      if (p) cb(p);
    }),
  );
}

/** Toucher sur une notification, application en arrière-plan. */
export function onPushOpened(cb: (p: PushPayload) => void): () => void {
  return safeListener(() =>
    onNotificationOpenedApp(getMessaging(), m => {
      const p = toPayload(m);
      if (p) cb(p);
    }),
  );
}

/** Notification qui a lancé l'application (application fermée). */
export async function getLaunchPush(): Promise<PushPayload | null> {
  return toPayload(await getInitialNotification(getMessaging()));
}

/** Android affiche lui-même la notification ; le gestionnaire évite l'avertissement. */
export function registerBackgroundPushHandler(): void {
  safeListener(() => {
    setBackgroundMessageHandler(getMessaging(), async () => undefined);
    return noop;
  });
}

export async function subscribeTopic(topic: string): Promise<void> {
  await subscribeToTopic(getMessaging(), topic);
}

export async function unsubscribeTopic(topic: string): Promise<void> {
  await unsubscribeFromTopic(getMessaging(), topic);
}
