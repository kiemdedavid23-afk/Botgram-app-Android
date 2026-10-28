/**
 * Vue vidéo native (ExoPlayer). Monter ce composant seulement quand l'utilisateur lance la
 * lecture (aperçu = miniature + bouton), puis le démonter : un seul décodeur actif à la fois.
 * Commandes : seekTo / play / pause via la ref.
 */
import React, {forwardRef, useImperativeHandle, useRef} from 'react';
import {
  NativeModules,
  UIManager,
  View,
  findNodeHandle,
  requireNativeComponent,
  type NativeSyntheticEvent,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type VideoLoadEvent = {durationMs: number; width: number; height: number};
export type VideoProgressEvent = {positionMs: number; durationMs: number};
export type VideoPlayStateEvent = {playing: boolean; buffering: boolean; ended: boolean};
export type VideoErrorEvent = {code: string; message: string};
export type VideoFullscreenEvent = {fullscreen: boolean};

export type NativeVideoProps = {
  style?: StyleProp<ViewStyle>;
  /** Chemin local du fichier (déjà téléchargé). */
  src: string;
  paused?: boolean;
  muted?: boolean;
  loop?: boolean;
  /** Barre native (lecture/pause, progression, durée, plein écran). Défaut : true. */
  controls?: boolean;
  resizeMode?: 'contain' | 'cover';
  startMs?: number;
  onLoad?: (e: NativeSyntheticEvent<VideoLoadEvent>) => void;
  onProgress?: (e: NativeSyntheticEvent<VideoProgressEvent>) => void;
  onPlayState?: (e: NativeSyntheticEvent<VideoPlayStateEvent>) => void;
  onEnd?: () => void;
  onError?: (e: NativeSyntheticEvent<VideoErrorEvent>) => void;
  onFullscreen?: (e: NativeSyntheticEvent<VideoFullscreenEvent>) => void;
};

export type NativeVideoHandle = {
  seekTo(ms: number): void;
  play(): void;
  pause(): void;
};

const hasNative = NativeModules.BotgramAudio != null;

const RawVideo = hasNative
  ? requireNativeComponent<NativeVideoProps & {ref?: unknown}>('BotgramVideoView')
  : null;

export const NativeVideoView = forwardRef<NativeVideoHandle, NativeVideoProps>(
  function NativeVideoView(props, ref) {
    const inner = useRef<View>(null);

    const dispatch = (command: string, args: unknown[] = []) => {
      const node = findNodeHandle(inner.current);
      if (node != null) {
        UIManager.dispatchViewManagerCommand(node, command, args);
      }
    };

    useImperativeHandle(ref, () => ({
      seekTo: (ms: number) => dispatch('seekTo', [ms]),
      play: () => dispatch('play'),
      pause: () => dispatch('pause'),
    }));

    if (!RawVideo) return null;
    const Raw = RawVideo as unknown as React.ComponentType<
      NativeVideoProps & {ref: React.RefObject<View | null>}
    >;
    return <Raw {...props} ref={inner} />;
  },
);
