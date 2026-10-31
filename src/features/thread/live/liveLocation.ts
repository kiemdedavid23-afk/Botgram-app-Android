/**
 * Partage de position en direct : une seule session à la fois.
 * Le service natif lit le GPS ; ici on envoie au Worker (PATCH) au plus toutes les 15 s
 * (limite serveur : 40/min), on gère l'expiration, le 409 (déjà arrêtée) et le 429 (pause 60 s).
 * Limite connue : si Android tue l'app, la session s'arrête (le Worker l'expire seul).
 */
import {NativeEventEmitter, NativeModules} from 'react-native';
import {create} from 'zustand';
import {
  updateLiveLocation,
  stopLiveLocation,
} from '../../../core/api/endpoints/messages';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {attachTexts as t} from '../attach/texts';

type NativeLive = {
  start(title: string, text: string, stopLabel: string): Promise<void>;
  stop(): Promise<void>;
};
const native = NativeModules.BotgramLiveLocation as NativeLive | undefined;

export const LIVE_MIN_INTERVAL_MS = 15_000;
const RATE_PAUSE_MS = 60_000;

type LiveState = {
  /** Message dont la position est actuellement partagée (id serveur). */
  activeId: string | null;
  /** Messages dont le partage est terminé pendant cette session de l'app. */
  ended: Record<string, true>;
};

export const useLiveLocationStore = create<LiveState>(() => ({
  activeId: null,
  ended: {},
}));

type Session = {
  messageId: string;
  until: number;
  lastSent: number;
  pausedUntil: number;
  timer: ReturnType<typeof setTimeout>;
};

let session: Session | null = null;
let subscribed = false;

type UpdateEvent = {
  latitude: number;
  longitude: number;
  accuracy: number;
  heading: number;
};

function subscribe(): void {
  if (subscribed || !native) return;
  subscribed = true;
  const em = new NativeEventEmitter(NativeModules.BotgramLiveLocation);
  em.addListener('BotgramLiveLocationUpdate', (ev: unknown) =>
    onUpdate(ev as UpdateEvent),
  );
  em.addListener('BotgramLiveLocationStop', () => {
    if (session) fireAndForget(stopLive(session.messageId));
  });
}

function onUpdate(ev: UpdateEvent): void {
  const s = session;
  if (!s) return;
  const now = Date.now();
  if (now >= s.until) {
    fireAndForget(stopLive(s.messageId, false));
    return;
  }
  if (now - s.lastSent < LIVE_MIN_INTERVAL_MS || now < s.pausedUntil) return;
  s.lastSent = now;
  fireAndForget(
    updateLiveLocation(s.messageId, {
      latitude: ev.latitude,
      longitude: ev.longitude,
      ...(ev.accuracy > 0 ? {horizontal_accuracy: Math.min(ev.accuracy, 1500)} : {}),
      ...(ev.heading > 0 ? {heading: ev.heading} : {}),
    }).then(res => {
      if (res.ok || session?.messageId !== s.messageId) return;
      if (res.status === 409) {
        // Arrêtée ou expirée côté serveur : inutile de la prévenir.
        fireAndForget(stopLive(s.messageId, false));
      } else if (res.status === 429 || res.error.code === 'RATE_LIMITED') {
        s.pausedUntil = Date.now() + RATE_PAUSE_MS;
      }
      // Réseau coupé ou autre erreur : on réessaie à la prochaine position.
    }),
  );
}

/** Démarre le partage pour un message déjà envoyé (id serveur). */
export async function startLive(
  messageId: string,
  periodSec: number,
): Promise<void> {
  if (!native) return;
  if (session) await stopLive(session.messageId);
  subscribe();
  const until = Date.now() + periodSec * 1000;
  const timer = setTimeout(() => {
    fireAndForget(stopLive(messageId, false));
  }, periodSec * 1000);
  session = {messageId, until, lastSent: Date.now(), pausedUntil: 0, timer};
  useLiveLocationStore.setState({activeId: messageId});
  try {
    await native.start(t.liveNotifTitle, t.liveNotifText, t.liveNotifStop);
  } catch {
    // Service impossible à démarrer : on termine proprement (le Worker expirera le message).
    await stopLive(messageId, true);
  }
}

/** Arrête le partage ; `notifyServer` false si le serveur l'a déjà terminé. */
export async function stopLive(
  messageId: string,
  notifyServer = true,
): Promise<void> {
  if (session?.messageId === messageId) {
    clearTimeout(session.timer);
    session = null;
    useLiveLocationStore.setState({activeId: null});
    if (native) {
      try {
        await native.stop();
      } catch {
        // déjà arrêté
      }
    }
  }
  useLiveLocationStore.setState(s => ({ended: {...s.ended, [messageId]: true}}));
  if (notifyServer) fireAndForget(stopLiveLocation(messageId));
}
