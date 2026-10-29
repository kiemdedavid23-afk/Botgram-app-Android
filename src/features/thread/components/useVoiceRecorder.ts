/**
 * Geste « maintenir le micro » : enregistre tant que le doigt reste appuyé,
 * envoie au relâchement, annule si on glisse vers la gauche (ou si c'est trop court).
 * La logique ne touche qu'à des refs : le PanResponder peut donc rester figé.
 */
import {useEffect, useMemo, useRef, useState} from 'react';
import {PanResponder, type GestureResponderHandlers} from 'react-native';
import {audioEngine} from '../../../core/media/native/nativeMedia';
import {
  cancelVoiceRecording,
  ensureMicPermission,
  isVoiceRecorderAvailable,
  onVoiceLevel,
  startVoiceRecording,
  stopVoiceRecording,
} from '../../../core/media/native/voiceRecorder';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {PickedFile} from '../store/sendMediaActions';
import {threadTexts as t} from '../texts';

/** En dessous, l'enregistrement est jeté (appui involontaire). */
const MIN_MS = 600;
/** Glissement vers la gauche qui annule. */
const CANCEL_DX = 90;

export type VoiceUi = {
  recording: boolean;
  cancelling: boolean;
  elapsedMs: number;
  level: number;
};

const IDLE: VoiceUi = {
  recording: false,
  cancelling: false,
  elapsedMs: 0,
  level: 0,
};

type Options = {
  enabled: boolean;
  onFinished: (file: PickedFile) => void;
  onNotice: (message: string) => void;
};

type Phase = 'idle' | 'starting' | 'recording' | 'stopping';
type End = 'send' | 'cancel';

export function useVoiceRecorder(opts: Options): {
  ui: VoiceUi;
  handlers: GestureResponderHandlers;
  available: boolean;
} {
  const optsRef = useRef(opts);
  optsRef.current = opts;
  const phase = useRef<Phase>('idle');
  const pendingEnd = useRef<End | null>(null);
  const startedAt = useRef(0);
  const [ui, setUi] = useState<VoiceUi>(IDLE);

  const responder = useMemo(() => {
    const finish = async (mode: End): Promise<void> => {
      phase.current = 'stopping';
      const elapsed = Date.now() - startedAt.current;
      setUi(IDLE);
      if (mode === 'cancel') {
        cancelVoiceRecording();
        phase.current = 'idle';
        return;
      }
      if (elapsed < MIN_MS) {
        cancelVoiceRecording();
        optsRef.current.onNotice(t.voiceHoldHint);
        phase.current = 'idle';
        return;
      }
      try {
        const r = await stopVoiceRecording();
        optsRef.current.onFinished({
          uri: `file://${r.path}`,
          name: r.path.split('/').pop() ?? 'voice',
          mime: r.mime,
          size: r.size,
        });
      } catch {
        optsRef.current.onNotice(t.voiceHoldHint);
      }
      phase.current = 'idle';
    };

    const begin = async (): Promise<void> => {
      if (phase.current !== 'idle' || !optsRef.current.enabled) return;
      phase.current = 'starting';
      pendingEnd.current = null;
      try {
        const perm = await ensureMicPermission();
        if (perm !== 'granted') {
          // Fenêtre système affichée : le doigt est déjà levé, il faut réappuyer.
          phase.current = 'idle';
          if (perm === 'denied') optsRef.current.onNotice(t.voiceMicDenied);
          return;
        }
        if (pendingEnd.current) {
          phase.current = 'idle';
          return;
        }
        audioEngine.pause();
        await startVoiceRecording();
      } catch {
        phase.current = 'idle';
        optsRef.current.onNotice(t.voiceFailed);
        return;
      }
      startedAt.current = Date.now();
      phase.current = 'recording';
      setUi({recording: true, cancelling: false, elapsedMs: 0, level: 0});
      const early = pendingEnd.current;
      if (early) fireAndForget(finish(early));
    };

    const endGesture = (mode: End): void => {
      if (phase.current === 'recording') fireAndForget(finish(mode));
      else if (phase.current === 'starting') pendingEnd.current = mode;
    };

    return PanResponder.create({
      onStartShouldSetPanResponder: () => optsRef.current.enabled,
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        fireAndForget(begin());
      },
      onPanResponderMove: (_e, g) => {
        const cancelling = g.dx < -CANCEL_DX;
        setUi(u =>
          u.recording && u.cancelling !== cancelling ? {...u, cancelling} : u,
        );
      },
      onPanResponderRelease: (_e, g) =>
        endGesture(g.dx < -CANCEL_DX ? 'cancel' : 'send'),
      onPanResponderTerminate: () => endGesture('cancel'),
    });
  }, []);

  // Niveau sonore et durée, pendant l'enregistrement seulement.
  useEffect(() => {
    if (!ui.recording) return undefined;
    return onVoiceLevel(e =>
      setUi(u =>
        u.recording ? {...u, elapsedMs: e.elapsedMs, level: e.level} : u,
      ),
    );
  }, [ui.recording]);

  // Quitter l'écran en plein enregistrement : on coupe le micro.
  useEffect(
    () => () => {
      if (phase.current === 'recording' || phase.current === 'starting') {
        cancelVoiceRecording();
      }
    },
    [],
  );

  return {
    ui,
    handlers: responder.panHandlers,
    available: isVoiceRecorderAvailable(),
  };
}
