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
import {Send, Paperclip, X} from 'lucide-react-native';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {useTheme, getShadow} from '../../../shared/theme';
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
  const {colors, mode, appearance} = useTheme();
  const sendWithEnter = appearance.sendWithEnter;
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

  const canSubmit = canSendText || canSendMedia;

  return (
    <View style={styles.bar}>
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
  sendingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.composerSendingGap,
  },
});
