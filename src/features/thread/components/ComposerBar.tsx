/**
 * Barre de saisie + pièce jointe (L5d / L6c).
 */
import React, {useState, useCallback, useRef, useEffect} from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
  Keyboard,
} from 'react-native';
import {Send, Paperclip, X, Mic} from 'lucide-react-native';
import {useTheme, getShadow} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {PickedFile} from '../store/sendMediaActions';
import {MEDIA_CAPTION_MAX} from '../mediaLimits';
import {useVoiceRecorder} from './useVoiceRecorder';
import {AttachSheet} from '../attach/AttachSheet';
import type {ContactDraft, LocationDraft} from '../store/sendActions';

function formatClock(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = (total % 60).toString().padStart(2, '0');
  return `${m}:${sec}`;
}

type Props = {
  disabled: boolean;
  sending: boolean;
  onSend: (text: string) => Promise<void>;
  onSendMedia: (
    files: PickedFile[],
    caption: string,
    signal?: AbortSignal,
  ) => Promise<void>;
  onSendContact: (contact: ContactDraft) => Promise<void>;
  onSendLocation: (loc: LocationDraft) => Promise<void>;
  onSendLiveLocation: (loc: LocationDraft, periodSec: number) => Promise<void>;
};

export function ComposerBar({
  disabled,
  sending,
  onSend,
  onSendMedia,
  onSendContact,
  onSendLocation,
  onSendLiveLocation,
}: Props): React.JSX.Element {
  const {colors, mode, appearance} = useTheme();
  const sendWithEnter = appearance.sendWithEnter;
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PickedFile[]>([]);
  const [sheetOpen, setSheetOpen] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2500);
  }, []);
  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );
  const voice = useVoiceRecorder({
    enabled: !disabled && !sending,
    onFinished: file => {
      fireAndForget(onSendMedia([file], ''));
    },
    onNotice: showNotice,
  });
  const len = text.length;
  const trimmedEmpty = text.trim().length === 0;
  const tooLong = len > tm.maxMessageLength;
  const canSendText =
    !disabled && !sending && !trimmedEmpty && !tooLong && pending.length === 0;
  const canSendMedia =
    !disabled && !sending && pending.length > 0 && text.length <= MEDIA_CAPTION_MAX;

  const submit = useCallback(() => {
    if (pending.length > 0) {
      if (!canSendMedia) return;
      const files = pending;
      const caption = text.trim();
      setPending([]);
      setText('');
      const ac = new AbortController();
      abortRef.current = ac;
      fireAndForget(
        onSendMedia(files, caption, ac.signal).finally(() => {
          abortRef.current = null;
        }),
      );
      return;
    }
    if (!canSendText) return;
    const payload = text;
    setText('');
    fireAndForget(onSend(payload));
  }, [canSendText, canSendMedia, text, pending, onSend, onSendMedia]);

  const onAttach = useCallback(() => {
    Keyboard.dismiss();
    setSheetOpen(true);
  }, []);

  // Photos / vidéos choisies dans le tiroir : envoi direct avec leur légende.
  const sendFromSheet = useCallback(
    (files: PickedFile[], captionText: string) => {
      const ac = new AbortController();
      abortRef.current = ac;
      fireAndForget(
        onSendMedia(files, captionText, ac.signal).finally(() => {
          abortRef.current = null;
        }),
      );
    },
    [onSendMedia],
  );

  // Fichiers de l'onglet Fichier : ajoutés au message en cours.
  const addPending = useCallback((files: PickedFile[]) => {
    setPending(files);
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  const canSubmit = canSendText || canSendMedia;
  // Champ vide, rien en attente : le micro prend la place du bouton d'envoi.
  const showMic =
    voice.available && trimmedEmpty && pending.length === 0 && !sending && !disabled;

  return (
    <View style={styles.bar}>
      {notice ? (
        <View
          style={[
            styles.notice,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Text style={{color: colors.textSecondary, fontSize: tm.retryBtnFont}}>
            {notice}
          </Text>
        </View>
      ) : null}
      {pending.length > 0 ? (
        <View
          style={[
            styles.pending,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Text style={{color: colors.textSecondary, fontSize: tm.retryBtnFont}}>
            {t.mediaFilesPending(pending.length)}
          </Text>
          <Pressable onPress={() => setPending([])}>
            <Text style={{color: colors.accent, fontSize: tm.retryBtnFont}}>
              {t.cancel}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        {voice.ui.recording ? (
          <View
            style={[
              styles.pill,
              styles.recPill,
              {backgroundColor: colors.bgPrimary},
              getShadow('sm', mode),
            ]}>
            <View style={[styles.recDot, {backgroundColor: colors.danger}]} />
            <Text style={[styles.recTimer, {color: colors.textPrimary}]}>
              {formatClock(voice.ui.elapsedMs)}
            </Text>
            <View
              style={[
                styles.recLevel,
                {
                  backgroundColor: colors.accent,
                  width: 6 + Math.round(voice.ui.level * 36),
                },
              ]}
            />
            <Text
              numberOfLines={1}
              style={[
                styles.recHint,
                {
                  color: voice.ui.cancelling
                    ? colors.danger
                    : colors.textSecondary,
                },
              ]}>
              {voice.ui.cancelling
                ? t.voiceReleaseCancel
                : `‹ ${t.voiceSlideCancel}`}
            </Text>
          </View>
        ) : (
        <View
          style={[
            styles.pill,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder={t.composerPlaceholder}
            placeholderTextColor={colors.textHint}
            editable={!disabled}
            multiline={!sendWithEnter}
            blurOnSubmit={sendWithEnter}
            returnKeyType={sendWithEnter ? 'send' : 'default'}
            onSubmitEditing={sendWithEnter ? submit : undefined}
            maxLength={
              pending.length > 0
                ? MEDIA_CAPTION_MAX + 1
                : tm.maxMessageLength + 1
            }
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                maxHeight: tm.composerInputMaxH,
              },
            ]}
          />
          <Pressable
            onPress={onAttach}
            disabled={disabled || sending}
            accessibilityLabel={t.mediaAttach}
            style={styles.iconBtn}>
            <Paperclip
              size={tm.composerSendIconSize}
              color={disabled ? colors.textHint : colors.textSecondary}
              strokeWidth={2}
            />
          </Pressable>
        </View>
        )}
        {sending ? (
          <View style={styles.sendingRow}>
            <ActivityIndicator color={colors.accent} />
            <Pressable
              onPress={cancel}
              accessibilityLabel={t.cancelSend}
              style={styles.iconBtn}>
              <X
                size={tm.composerSendIconSize}
                color={colors.danger}
                strokeWidth={2}
              />
            </Pressable>
          </View>
        ) : showMic ? (
          <View
            {...voice.handlers}
            accessible
            accessibilityRole="button"
            accessibilityLabel={t.voiceMic}
            style={[
              styles.send,
              {
                backgroundColor: colors.accent,
                transform: [{scale: voice.ui.recording ? 1.25 : 1}],
              },
              getShadow('sm', mode),
            ]}>
            <Mic
              size={tm.composerSendIconSize}
              color={colors.white}
              strokeWidth={2}
            />
          </View>
        ) : (
          <Pressable
            onPress={submit}
            disabled={!canSubmit}
            accessibilityLabel={t.send}
            style={[
              styles.send,
              {backgroundColor: canSubmit ? colors.accent : colors.bgPrimary},
              getShadow('sm', mode),
            ]}>
            <Send
              size={tm.composerSendIconSize}
              color={canSubmit ? colors.white : colors.textHint}
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>
      <AttachSheet
        visible={sheetOpen}
        onClose={() => setSheetOpen(false)}
        onSend={sendFromSheet}
        onPickFiles={addPending}
        onSendContact={c => fireAndForget(onSendContact(c))}
        onSendLocation={l => fireAndForget(onSendLocation(l))}
        onSendLiveLocation={(l, p) => fireAndForget(onSendLiveLocation(l, p))}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  // Transparent : le fond d'écran de la conversation reste visible autour.
  bar: {
    padding: tm.composerPad,
    gap: tm.composerGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tm.composerGap,
  },
  pill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    minHeight: tm.composerRound,
    borderRadius: tm.composerPillRadius,
  },
  pending: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: tm.composerInputPadH + 4,
    borderRadius: tm.composerPillRadius,
  },
  iconBtn: {
    width: tm.composerSendSize + 4,
    height: tm.composerRound,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: tm.composerRound,
    paddingVertical: tm.composerInputPadV + 2,
    paddingLeft: tm.composerInputPadH + 6,
    paddingRight: 0,
    fontSize: tm.composerFontSize,
  },
  send: {
    width: tm.composerRound,
    height: tm.composerRound,
    borderRadius: tm.composerRound / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notice: {
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: tm.composerPillRadius,
  },
  recPill: {
    alignItems: 'center',
    paddingHorizontal: tm.composerInputPadH + 4,
    gap: 10,
  },
  recDot: {width: 10, height: 10, borderRadius: 5},
  recTimer: {fontSize: tm.composerFontSize, minWidth: 40},
  recLevel: {height: 6, borderRadius: 3},
  recHint: {flex: 1, textAlign: 'right', fontSize: tm.retryBtnFont + 1},
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.composerSendingGap,
  },
});
