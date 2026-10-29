/**
 * Vidéo / GIF (animation) / vidéo ronde dans une bulle.
 *  - Avant le téléchargement : cadre sombre + « Télécharger (taille) », avec progression.
 *  - Après : miniature (tirée de la vidéo par le natif) + bouton lecture + durée.
 *  - Lecture : lecteur natif ExoPlayer dans la bulle (barre de progression, plein écran).
 *  - GIF : lecture automatique en boucle, sans son ni contrôles (si ≤ 2 Mo).
 * Le décodeur vidéo n'existe que pendant la lecture (la vue native est montée à l'appui).
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {Download, Play} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {
  getVideoInfo,
  isNativeAudioAvailable,
  type VideoInfo,
} from '../../../core/media/native/nativeMedia';
import {NativeVideoView} from '../../../core/media/native/NativeVideoView';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useMediaDownload} from './useMediaDownload';

type Props = {
  messageId: string;
  kind?: 'video' | 'animation' | 'video_note' | string;
  size?: number | null;
  /** Cellule d'album : demi-largeur de bulle. */
  compact?: boolean;
  /** Cellule de mosaïque : dimensions imposées. */
  forceWidth?: number;
  forceHeight?: number;
};

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

function sizeLabel(size?: number | null): string {
  if (!size || size <= 0) return '';
  return size >= 1024 * 1024 ? t.mediaSizeMb(size) : t.mediaSizeKb(size);
}

export function MediaVideo({
  messageId,
  kind,
  size,
  compact,
  forceWidth,
  forceHeight,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const {width: screenW} = useWindowDimensions();
  const isGif = kind === 'animation';
  const isRound = kind === 'video_note';
  const autoGif =
    isGif && (size === null || size === undefined || size <= tm.autoDownloadMaxBytes);

  const dl = useMediaDownload(messageId, {autoStart: autoGif});
  const [info, setInfo] = useState<VideoInfo | null>(null);
  const [playing, setPlaying] = useState(false);
  const [full, setFull] = useState(false);
  const [playError, setPlayError] = useState(false);
  const startMs = useRef(0);
  const posMs = useRef(0);

  // Miniature + dimensions + durée, dès que le fichier est sur le téléphone.
  useEffect(() => {
    if (!dl.path) return;
    let alive = true;
    fireAndForget(
      getVideoInfo(dl.path, messageId).then(v => {
        if (alive) setInfo(v);
      }),
    );
    return () => {
      alive = false;
    };
  }, [dl.path, messageId]);

  // GIF : lecture automatique dès qu'il est prêt.
  useEffect(() => {
    if (autoGif && dl.path) setPlaying(true);
  }, [autoGif, dl.path]);

  const fullW = Math.min(
    Math.round(screenW * tm.bubbleMaxWidthPct) - 2 * tm.bubblePadH,
    300,
  );
  const boxW = isRound
    ? Math.min(200, Math.round(screenW * 0.55))
    : compact
      ? Math.floor(fullW / tm.mediaAlbumColumns) - tm.mediaAlbumGap
      : fullW;
  const ratio = isRound
    ? 1
    : info && info.width > 0 && info.height > 0
      ? Math.min(2, Math.max(0.5, info.width / info.height))
      : 16 / 9;
  const forced = forceWidth !== undefined && forceHeight !== undefined;
  const boxStyle = {
    width: forced ? forceWidth : boxW,
    height: forced ? forceHeight : Math.round(boxW / ratio),
    borderRadius: forced ? 0 : isRound ? boxW / 2 : tm.mediaPhotoRadius,
  };

  const onPressPlay = useCallback(() => {
    setPlayError(false);
    fireAndForget(
      (async () => {
        const p = dl.path ?? (await dl.download());
        if (p) setPlaying(true);
      })(),
    );
  }, [dl]);

  const openFull = useCallback(() => {
    startMs.current = posMs.current;
    setPlaying(false); // libère le lecteur de la bulle ; le plein écran reprend à la même position
    setFull(true);
  }, []);

  const closeFull = useCallback(() => {
    setFull(false);
    startMs.current = posMs.current;
  }, []);

  const nativeOk = isNativeAudioAvailable();

  return (
    <View style={[styles.box, boxStyle]}>
      {playing && dl.path && nativeOk ? (
        <NativeVideoView
          style={StyleSheet.absoluteFill}
          src={dl.path}
          paused={false}
          muted={isGif}
          loop={isGif}
          controls={!isGif}
          resizeMode={isRound ? 'cover' : 'contain'}
          startMs={startMs.current}
          onProgress={e => {
            posMs.current = e.nativeEvent.positionMs;
          }}
          onFullscreen={openFull}
          onError={() => {
            setPlaying(false);
            setPlayError(true);
          }}
        />
      ) : (
        <Pressable
          onPress={onPressPlay}
          accessibilityRole="button"
          accessibilityLabel={t.mediaPlay}
          style={StyleSheet.absoluteFill}>
          {info?.thumbUri ? (
            <Image
              source={{uri: info.thumbUri}}
              style={StyleSheet.absoluteFill}
              resizeMode="cover"
            />
          ) : null}
          <View style={styles.center}>
            {dl.loading ? (
              <View style={styles.pill}>
                <ActivityIndicator color="#fff" />
                {dl.progress > 0 ? (
                  <Text style={styles.pillText}>{Math.round(dl.progress * 100)} %</Text>
                ) : null}
              </View>
            ) : dl.path ? (
              <View style={[styles.playBtn, {backgroundColor: colors.accent}]}>
                <Play size={26} color="#fff" fill="#fff" />
              </View>
            ) : (
              <View style={styles.pill}>
                <Download size={18} color="#fff" />
                <Text style={styles.pillText}>{sizeLabel(size)}</Text>
              </View>
            )}
          </View>
          {info && info.durationMs > 0 && !dl.loading ? (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{formatDuration(info.durationMs)}</Text>
            </View>
          ) : null}
          {dl.error || playError ? (
            <View style={styles.errorBar}>
              <Text style={styles.errorText}>
                {playError ? t.mediaPlayError : dl.error}
              </Text>
            </View>
          ) : null}
        </Pressable>
      )}

      <Modal
        visible={full}
        animationType="fade"
        statusBarTranslucent
        supportedOrientations={['portrait', 'landscape']}
        onRequestClose={closeFull}>
        <View style={styles.fullRoot}>
          {full && dl.path && nativeOk ? (
            <NativeVideoView
              style={StyleSheet.absoluteFill}
              src={dl.path}
              paused={false}
              controls
              resizeMode="contain"
              startMs={startMs.current}
              onProgress={e => {
                posMs.current = e.nativeEvent.positionMs;
              }}
              onFullscreen={closeFull}
            />
          ) : null}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {backgroundColor: '#000', overflow: 'hidden'},
  center: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: 'center', justifyContent: 'center'},
  playBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 3,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  pillText: {color: '#fff', fontSize: 13},
  badge: {
    position: 'absolute',
    left: 8,
    bottom: 8,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: {color: '#fff', fontSize: 12},
  errorBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    padding: 6,
    backgroundColor: 'rgba(0,0,0,0.65)',
  },
  errorText: {color: '#fff', fontSize: 12, textAlign: 'center'},
  fullRoot: {flex: 1, backgroundColor: '#000'},
});
