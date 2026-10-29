/**
 * Pont JS vers l'enregistreur vocal natif (Kotlin, MediaRecorder).
 * Sans module natif (tests Jest, iOS) : `isVoiceRecorderAvailable()` renvoie false.
 */
import {NativeEventEmitter, NativeModules, PermissionsAndroid, Platform} from 'react-native';

type RecorderModule = {
  start(): Promise<{path: string; mime: string}>;
  stop(): Promise<{path: string; mime: string; size: number; durationMs: number}>;
  cancel(): void;
};

export type VoiceResult = {
  path: string;
  mime: string;
  size: number;
  durationMs: number;
};

export type VoiceLevel = {level: number; elapsedMs: number};

const mod = NativeModules.BotgramVoiceRecorder as RecorderModule | undefined;
const emitter = mod ? new NativeEventEmitter(NativeModules.BotgramVoiceRecorder) : null;

export const isVoiceRecorderAvailable = (): boolean => mod != null;

export type MicPermission = 'granted' | 'asked' | 'denied';

/**
 * 'granted' : on peut enregistrer tout de suite.
 * 'asked'   : la fenêtre système vient de s'afficher et le membre a accepté (le doigt est déjà levé :
 *             il doit réappuyer).
 * 'denied'  : refusé (ou « ne plus demander »).
 */
export async function ensureMicPermission(): Promise<MicPermission> {
  if (Platform.OS !== 'android') return 'denied';
  const perm = PermissionsAndroid.PERMISSIONS.RECORD_AUDIO;
  if (await PermissionsAndroid.check(perm)) return 'granted';
  const res = await PermissionsAndroid.request(perm);
  return res === PermissionsAndroid.RESULTS.GRANTED ? 'asked' : 'denied';
}

export async function startVoiceRecording(): Promise<void> {
  if (!mod) throw new Error('recorder_unavailable');
  await mod.start();
}

export async function stopVoiceRecording(): Promise<VoiceResult> {
  if (!mod) throw new Error('recorder_unavailable');
  return mod.stop();
}

export function cancelVoiceRecording(): void {
  mod?.cancel();
}

/** Niveau sonore (0..1) et durée écoulée, ~10 fois par seconde pendant l'enregistrement. */
export function onVoiceLevel(cb: (e: VoiceLevel) => void): () => void {
  if (!emitter) return () => {};
  const sub = emitter.addListener('botgramVoiceLevel', (e: unknown) => cb(e as VoiceLevel));
  return () => sub.remove();
}
