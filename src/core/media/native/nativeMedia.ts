/**
 * Pont JS vers les modules médias natifs (Kotlin, Media3) :
 *  - BotgramDownload   : téléchargement direct vers le disque
 *  - BotgramAudio      : moteur audio partagé (vocaux / audios, notification, arrière-plan)
 *  - BotgramMediaTools : miniatures vidéo + forme d'onde audio
 * Chaque fonction est sûre si le module est absent (tests Jest, iOS) : voir `isAvailable`.
 */
import {NativeEventEmitter, NativeModules} from 'react-native';

type DownloadModule = {
  download(
    id: string,
    url: string,
    destPath: string,
    headers: Record<string, string>,
    maxBytes: number,
  ): Promise<{path: string; size: number; mime: string}>;
  cancel(id: string): void;
};

export type AudioItem = {
  id: string;
  /** Chemin local du fichier déjà téléchargé. */
  path: string;
  title?: string;
  subtitle?: string;
};

export type AudioStatus = 'idle' | 'buffering' | 'playing' | 'paused' | 'ended';

export type AudioState = {
  id: string | null;
  index: number;
  state: AudioStatus;
  positionMs: number;
  durationMs: number;
  speed: number;
};

type AudioModule = {
  playQueue(items: AudioItem[], startIndex: number, startPositionMs: number): void;
  resume(): void;
  pause(): void;
  stop(): void;
  seekTo(positionMs: number): void;
  setSpeed(speed: number): void;
  getState(): Promise<AudioState>;
};

export type VideoInfo = {
  thumbUri: string;
  width: number;
  height: number;
  durationMs: number;
};

type ToolsModule = {
  videoInfo(path: string, id: string): Promise<VideoInfo>;
  mediaDuration(path: string): Promise<number>;
  waveform(path: string, id: string, bars: number): Promise<number[]>;
  clearCaches(): Promise<boolean>;
};

const downloadModule = NativeModules.BotgramDownload as DownloadModule | undefined;
const audioModule = NativeModules.BotgramAudio as AudioModule | undefined;
const toolsModule = NativeModules.BotgramMediaTools as ToolsModule | undefined;

export const isNativeDownloadAvailable = (): boolean => downloadModule != null;
export const isNativeAudioAvailable = (): boolean => audioModule != null;
export const isNativeToolsAvailable = (): boolean => toolsModule != null;

// ---------------------------------------------------------------- Téléchargement

export type NativeDownloadResult =
  | {ok: true; path: string; size: number}
  | {ok: false; code: string; message: string};

const downloadEmitter = downloadModule ? new NativeEventEmitter(NativeModules.BotgramDownload) : null;

/** Progression d'un téléchargement (`total` = 0 si inconnu). Retourne la fonction de désabonnement. */
export function onDownloadProgress(
  id: string,
  cb: (received: number, total: number) => void,
): () => void {
  if (!downloadEmitter) return () => {};
  const sub = downloadEmitter.addListener(
    'botgramDownloadProgress',
    (raw: unknown) => {
      const e = raw as {id: string; received: number; total: number};
      if (e.id === id) cb(e.received, e.total);
    },
  );
  return () => sub.remove();
}

export async function nativeDownload(params: {
  id: string;
  url: string;
  destPath: string;
  headers: Record<string, string>;
  maxBytes: number;
  signal?: AbortSignal;
}): Promise<NativeDownloadResult> {
  if (!downloadModule) {
    return {ok: false, code: 'native_unavailable', message: 'Module natif absent'};
  }
  const {id, url, destPath, headers, maxBytes, signal} = params;
  const onAbort = () => downloadModule.cancel(id);
  if (signal) {
    if (signal.aborted) return {ok: false, code: 'cancelled', message: 'Annulé'};
    signal.addEventListener('abort', onAbort);
  }
  try {
    const r = await downloadModule.download(id, url, destPath, headers, maxBytes);
    return {ok: true, path: r.path, size: r.size};
  } catch (e) {
    const err = e as {code?: string; message?: string};
    return {
      ok: false,
      code: err.code ?? 'network_error',
      message: err.message ?? 'Erreur réseau',
    };
  } finally {
    signal?.removeEventListener('abort', onAbort);
  }
}

// ---------------------------------------------------------------- Audio

const audioEmitter = audioModule ? new NativeEventEmitter(NativeModules.BotgramAudio) : null;

export const audioEngine = {
  /** Lance une file ; les éléments s'enchaînent automatiquement. */
  playQueue(items: AudioItem[], startIndex = 0, startPositionMs = 0): void {
    audioModule?.playQueue(items, startIndex, startPositionMs);
  },
  resume(): void {
    audioModule?.resume();
  },
  pause(): void {
    audioModule?.pause();
  },
  stop(): void {
    audioModule?.stop();
  },
  seekTo(positionMs: number): void {
    audioModule?.seekTo(positionMs);
  },
  /** 1, 1.5 ou 2 (conservée pour toute la file). */
  setSpeed(speed: number): void {
    audioModule?.setSpeed(speed);
  },
  async getState(): Promise<AudioState | null> {
    return audioModule ? audioModule.getState() : null;
  },
  /** État toutes les ~250 ms pendant la lecture, et à chaque changement. */
  subscribe(cb: (s: AudioState) => void): () => void {
    if (!audioEmitter) return () => {};
    const sub = audioEmitter.addListener('botgramAudioState', (e: unknown) => cb(e as AudioState));
    return () => sub.remove();
  },
  onError(cb: (e: {id: string | null; code: string; message: string}) => void): () => void {
    if (!audioEmitter) return () => {};
    const sub = audioEmitter.addListener('botgramAudioError', (e: unknown) =>
      cb(e as {id: string | null; code: string; message: string}),
    );
    return () => sub.remove();
  },
};

// ---------------------------------------------------------------- Miniatures / forme d'onde

/** Image d'aperçu + dimensions + durée d'une vidéo locale (null si impossible). */
export async function getVideoInfo(path: string, id: string): Promise<VideoInfo | null> {
  if (!toolsModule) return null;
  try {
    return await toolsModule.videoInfo(path, id);
  } catch {
    return null;
  }
}

/** Durée en ms d'un fichier audio/vidéo local (0 si inconnue). */
export async function getMediaDuration(path: string): Promise<number> {
  if (!toolsModule) return 0;
  try {
    return await toolsModule.mediaDuration(path);
  } catch {
    return 0;
  }
}

/** `bars` valeurs 0..100, ou null si le fichier n'est pas décodable (dessiner des barres de repli). */
export async function getWaveform(
  path: string,
  id: string,
  bars = 48,
): Promise<number[] | null> {
  if (!toolsModule) return null;
  try {
    return await toolsModule.waveform(path, id, bars);
  } catch {
    return null;
  }
}

export async function clearMediaToolCaches(): Promise<void> {
  try {
    await toolsModule?.clearCaches();
  } catch {
    // cache déjà vide
  }
}
