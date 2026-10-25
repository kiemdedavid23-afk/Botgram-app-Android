/**
 * Barre de saisie (L5d) — texte brut uniquement.
 */
import React, {useState, useCallback} from 'react';
import {
  View,
  TextInput,
  Pressable,
  Text,
  StyleSheet,
} from 'react-native';
import {Send} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  disabled: boolean;
  sending: boolean;
  onSend: (text: string) => Promise<void>;
};

export function ComposerBar({
  disabled,
  sending,
  onSend,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [text, setText] = useState('');
  const len = text.length;
  const trimmedEmpty = text.trim().length === 0;
  const tooLong = len > tm.maxMessageLength;
  const canSend = !disabled && !sending && !trimmedEmpty && !tooLong;

  const submit = useCallback(() => {
    if (!canSend) return;
    const payload = text;
    setText('');
    fireAndForget(onSend(payload));
  }, [canSend, text, onSend]);

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.border,
        },
      ]}>
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder={t.composerPlaceholder}
        placeholderTextColor={colors.textHint}
        editable={!disabled}
        multiline
        maxLength={tm.maxMessageLength + 1}
        style={[
          styles.input,
          {
            color: colors.textPrimary,
            backgroundColor: colors.bgSecondary,
            maxHeight: tm.composerInputMaxH,
          },
        ]}
      />
      {len >= tm.charCountThreshold ? (
        <Text
          style={{
            color: tooLong ? colors.danger : colors.textHint,
            fontSize: tm.retryBtnFont,
          }}>
          {len}/{tm.maxMessageLength}
        </Text>
      ) : null}
      <Pressable
        onPress={submit}
        disabled={!canSend}
        accessibilityLabel={t.send}
        style={[
          styles.send,
          canSend ? styles.sendEnabled : styles.sendDisabled,
          {
            backgroundColor: canSend ? colors.accent : colors.bgTertiary,
          },
        ]}>
        <Send
          size={tm.composerSendIconSize}
          color={canSend ? colors.white : colors.textHint}
          strokeWidth={2}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: tm.composerGap,
    padding: tm.composerPad,
    borderTopWidth: StyleSheet.hairlineWidth,
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
