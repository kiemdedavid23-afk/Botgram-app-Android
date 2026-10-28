/**
 * Audio (musique) et message vocal dans une bulle.
 * Bouton lecture/pause, forme d'onde (vocal) ou barre de progression (audio), durée,
 * vitesse 1× / 1,5× / 2×, appui sur la barre pour se déplacer. Un seul son à la fois :
 * le moteur natif est partagé. Les vocaux consécutifs s'enchaînent automatiquement.
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  type GestureResponderEvent,
  type LayoutChangeEvent,
} from 'react-native';
import {Music, Pause, Play} from 'lucide-react-native';
import {useTheme, useChatTheme} from '../../../shared/theme';
import {
  audioEngine,
  getMediaDuration,
  getWaveform,
  isNativeAudioAvailable,
  type AudioState,
} from '../../../core/media/native/nativeMedia';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {buildVoiceQueue} from '../voiceQueue';
import {useMediaDownload} from './useMediaDownload';

type Props = {
  messageId: string;
  kind: 'voice' | 'audio' | string;
  name?: string | null;
  size?: number | null;
  isOut?: boolean;
};

const BARS = 36;
const SPEEDS = [1, 1.5, 2] as const;

function formatClock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const s = (total % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

/** Barres de repli (fichier non décodable / forme d'onde pas encore prête) : stables par message. */
function fallbackBars(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < BARS; i += 1) {
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    out.push(25 + (Math.abs(h) % 55));
  }
  return out;
}

export function MediaAudio({messageId, kind, name, size, isOut}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const chat = useChatTheme();
  const isVoice = kind === 'voice';
  const dl = useMediaDownload(messageId);
  const [st, setSt] = useState<AudioState | null>(null);
  const [durationMs, setDurationMs] = useState(0);
  const [bars, setBars] = useState<number[] | null>(null);
  const [barsW, setBarsW] = useState(0);
  const [failed, setFailed] = useState(false);
  const starting = useRef(false);
  const [startingUi, setStartingUi] = useState(false);

  // Suivi de l'état du moteur, uniquement pour CE message.
  useEffect(() => {
    return audioEngine.subscribe(s => {
      if (s.id === messageId) {
        setSt(s);
        if (s.durationMs > 0) setDurationMs(s.durationMs);
      } else {
        setSt(prev => (prev ? null : prev));
      }
    });
  }, [messageId]);

  useEffect(() => {
    return audioEngine.onError(e => {
      if (e.id === messageId) setFailed(true);
    });
  }, [messageId]);

  // Durée + forme d'onde dès que le fichier est local.
  useEffect(() => {
    const p = dl.path;
    if (!p) return;
    let alive = true;
    fireAndForget(
      getMediaDuration(p).then(ms => {
        if (alive && ms > 0) setDurationMs(ms);
      }),
    );
    if (isVoice) {
      fireAndForget(
        getWaveform(p, messageId, BARS).then(w => {
          if (alive && w) setBars(w);
        }),
      );
    }
    return () => {
      alive = false;
    };
  }, [dl.path, messageId, isVoice]);

  const active = st != null && st.state !== 'idle' && st.state !== 'ended';
  const playing = st?.state === 'playing' || st?.state === 'buffering';
  const posMs = active || st?.state === 'ended' ? st?.positionMs ?? 0 : 0;
  const dur = durationMs > 0 ? durationMs : st?.durationMs ?? 0;
  const progress = dur > 0 ? Math.min(1, posMs / dur) : 0;
  const speed = st?.speed ?? 1;

  const fg = isOut ? chat.bubbleOutText : chat.bubbleInText;
  const dim = isOut ? chat.timeOut : chat.timeIn;

  const onPlayPause = useCallback(() => {
    if (!isNativeAudioAvailable()) return;
    setFailed(false);
    if (active) {
      if (playing) audioEngine.pause();
      else audioEngine.resume();
      return;
    }
    if (st?.state === 'ended') {
      audioEngine.resume(); // repart du début
      return;
    }
    if (starting.current) return;
    starting.current = true;
    setStartingUi(true);
    fireAndForget(
      (async () => {
        try {
          const p = dl.path ?? (await dl.download());
          if (!p) return;
          if (isVoice) {
            const queue = await buildVoiceQueue(messageId);
            audioEngine.playQueue(queue, 0, 0);
          } else {
            audioEngine.playQueue(
              [{id: messageId, path: p, title: name ?? t.kindAudio}],
              0,
              0,
            );
          }
        } finally {
          starting.current = false;
          setStartingUi(false);
        }
      })(),
    );
  }, [active, playing, st?.state, dl, isVoice, messageId, name]);

  const onSeek = useCallback(
    (e: GestureResponderEvent) => {
      if (!active || dur <= 0 || barsW <= 0) return;
      const ratio = Math.min(1, Math.max(0, e.nativeEvent.locationX / barsW));
      audioEngine.seekTo(Math.round(ratio * dur));
    },
    [active, dur, barsW],
  );

  const cycleSpeed = useCallback(() => {
    const i = SPEEDS.findIndex(s => s === speed);
    audioEngine.setSpeed(SPEEDS[(i + 1) % SPEEDS.length]!);
  }, [speed]);

  const shownBars = useMemo(() => bars ?? fallbackBars(messageId), [bars, messageId]);
  const busy = dl.loading || startingUi;
  const timeText = active || st?.state === 'ended' ? formatClock(posMs) : formatClock(dur);

  return (
    <View style={styles.row}>
      <Pressable
        onPress={onPlayPause}
        accessibilityRole="button"
        accessibilityLabel={playing ? t.mediaPause : t.mediaPlay}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        {busy ? (
          <ActivityIndicator color="#fff" />
        ) : playing ? (
          <Pause size={20} color="#fff" fill="#fff" />
        ) : (
          <Play size={20} color="#fff" fill="#fff" style={styles.playIcon} />
        )}
      </Pressable>

      <View style={styles.body}>
        {!isVoice ? (
          <View style={styles.titleRow}>
            <Music size={14} color={dim} />
            <Text numberOfLines={1} style={[styles.title, {color: fg}]}>
              {name ?? t.kindAudio}
            </Text>
          </View>
        ) : null}

        <View
          style={isVoice ? styles.wave : styles.bar}
          onLayout={(e: LayoutChangeEvent) => setBarsW(e.nativeEvent.layout.width)}
          onStartShouldSetResponder={() => active}
          onResponderRelease={onSeek}>
          {isVoice ? (
            shownBars.map((v, i) => {
              const played = (i + 0.5) / shownBars.length <= progress;
              return (
                <View
                  key={i}
                  pointerEvents="none"
                  style={[
                    styles.waveBar,
                    {
                      height: `${Math.max(12, v)}%`,
                      backgroundColor: played ? colors.accent : dim,
                      opacity: played ? 1 : 0.55,
                    },
                  ]}
                />
              );
            })
          ) : (
            <>
              <View pointerEvents="none" style={[styles.track, {backgroundColor: dim, opacity: 0.35}]} />
              <View
                pointerEvents="none"
                style={[styles.fill, {backgroundColor: colors.accent, width: `${progress * 100}%`}]}
              />
            </>
          )}
        </View>

        <View style={styles.meta}>
          <Text style={[styles.time, {color: dim}]}>
            {failed ? t.mediaPlayError : dl.error ?? timeText}
          </Text>
          {active ? (
            <Pressable
              onPress={cycleSpeed}
              accessibilityLabel={t.mediaSpeed}
              hitSlop={8}
              style={[styles.speed, {borderColor: dim}]}>
              <Text style={[styles.speedText, {color: fg}]}>{speed === 1.5 ? '1,5' : speed}×</Text>
            </Pressable>
          ) : size && !dl.path ? (
            <Text style={[styles.time, {color: dim}]}>
              {size >= 1024 * 1024 ? t.mediaSizeMb(size) : t.mediaSizeKb(size)}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 220, paddingVertical: 2},
  btn: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  playIcon: {marginLeft: 2},
  body: {flex: 1, minWidth: 0, gap: 4},
  titleRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  title: {flex: 1, fontSize: 14, fontWeight: '600'},
  wave: {height: 32, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  waveBar: {width: 3, borderRadius: 2},
  bar: {height: 20, justifyContent: 'center'},
  track: {height: 4, borderRadius: 2},
  fill: {position: 'absolute', left: 0, height: 4, borderRadius: 2},
  meta: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between'},
  time: {fontSize: 12},
  speed: {borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 1},
  speedText: {fontSize: 12, fontWeight: '700'},
});
