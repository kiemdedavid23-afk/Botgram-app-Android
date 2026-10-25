/**
 * Barre de saisie + pièce jointe (L5d / L6c).
 */
import React, {useState, useCallback, useRef} from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {Send, Paperclip} from 'lucide-react-native';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {PickedFile} from '../store/sendMediaActions';
import {MEDIA_CAPTION_MAX} from '../mediaLimits';

type Props = {
  disabled: boolean;
  sending: boolean;
  onSend: (text: string) => Promise<void>;
  onSendMedia: (
    files: PickedFile[],
    caption: string,
    signal?: AbortSignal,
  ) => Promise<void>;
};

export function ComposerBar({
  disabled,
  sending,
  onSend,
  onSendMedia,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [text, setText] = useState('');
  const [pending, setPending] = useState<PickedFile[]>([]);
  const abortRef = useRef<AbortController | null>(null);
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
    fireAndForget(
      (async () => {
        try {
          const results = await pick({
            allowMultiSelection: true,
            type: [types.allFiles],
          });
          const mapped: PickedFile[] = results.map(r => ({
            uri: r.uri,
            name: r.name ?? 'file',
            mime: r.type ?? 'application/octet-stream',
            size: typeof r.size === 'number' ? r.size : 0,
          }));
          setPending(mapped);
        } catch (e) {
          if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
            return;
          }
        }
      })(),
    );
  }, []);

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
  }, []);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.border,
        },
      ]}>
      {pending.length > 0 ? (
        <View style={styles.pending}>
          <Text style={{color: colors.textSecondary, fontSize: tm.retryBtnFont}}>
            {pending.length} fichier{pending.length > 1 ? 's' : ''}
          </Text>
          <Pressable onPress={() => setPending([])}>
            <Text style={{color: colors.accent, fontSize: tm.retryBtnFont}}>
              {t.cancel}
            </Text>
          </Pressable>
        </View>
      ) : null}
      <View style={styles.row}>
        <Pressable
          onPress={onAttach}
          disabled={disabled || sending}
          accessibilityLabel={t.mediaAttach}
          style={styles.iconBtn}>
          <Paperclip
            size={tm.composerSendIconSize}
            color={disabled ? colors.textHint : colors.accent}
            strokeWidth={2}
          />
        </Pressable>
        <TextInput
          value={text}
          onChangeText={setText}
          placeholder={
            pending.length > 0 ? t.composerPlaceholder : t.composerPlaceholder
          }
          placeholderTextColor={colors.textHint}
          editable={!disabled}
          multiline
          maxLength={
            pending.length > 0
              ? MEDIA_CAPTION_MAX + 1
              : tm.maxMessageLength + 1
          }
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              backgroundColor: colors.bgSecondary,
              maxHeight: tm.composerInputMaxH,
            },
          ]}
        />
        {sending ? (
          <Pressable onPress={cancel} style={styles.iconBtn}>
            <ActivityIndicator color={colors.accent} />
          </Pressable>
        ) : (
          <Pressable
            onPress={submit}
            disabled={!(canSendText || canSendMedia)}
            accessibilityLabel={t.send}
            style={[
              styles.send,
              canSendText || canSendMedia
                ? styles.sendEnabled
                : styles.sendDisabled,
              {
                backgroundColor:
                  canSendText || canSendMedia
                    ? colors.accent
                    : colors.bgTertiary,
              },
            ]}>
            <Send
              size={tm.composerSendIconSize}
              color={
                canSendText || canSendMedia ? colors.white : colors.textHint
              }
              strokeWidth={2}
            />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    padding: tm.composerPad,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: tm.composerGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tm.composerGap,
  },
  pending: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  iconBtn: {
    width: tm.composerSendSize,
    height: tm.composerSendSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    minHeight: tm.composerInputMinH,
    paddingVertical: tm.composerInputPadV,
    paddingHorizontal: tm.composerInputPadH,
    borderRadius: tm.composerInputRadius,
    fontSize: tm.composerFontSize,
  },
  send: {
    width: tm.composerSendSize,
    height: tm.composerSendSize,
    borderRadius: tm.composerSendSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendEnabled: {opacity: tm.composerSendEnabledOpacity},
  sendDisabled: {opacity: tm.composerSendDisabledOpacity},
});
