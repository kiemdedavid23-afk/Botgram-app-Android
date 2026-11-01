import React, {useState} from 'react';
import {View, TextInput, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {Send} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import {texts as T} from '../texts';

type Props = {busy: boolean; onSend: (text: string) => void};

export function FactorComposer({busy, onSend}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [value, setValue] = useState('');
  const canSend = value.trim().length > 0 && !busy;
  const submit = () => {
    if (!canSend) return;
    onSend(value);
    setValue('');
  };
  return (
    <View style={[styles.bar, {backgroundColor: colors.bgPrimary}]}>
      <TextInput
        value={value}
        onChangeText={setValue}
        placeholder={T.placeholder}
        placeholderTextColor={colors.textHint}
        multiline
        style={[
          styles.input,
          {backgroundColor: colors.bgSecondary, color: colors.textPrimary},
        ]}
      />
      <Pressable
        accessibilityLabel={T.send}
        onPress={submit}
        disabled={!canSend}
        style={[
          styles.send,
          {backgroundColor: colors.accent},
          canSend || busy ? null : styles.dimmed,
        ]}>
        {busy ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Send size={20} color={colors.white} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  dimmed: {opacity: 0.4},
  bar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: bm.composerGap,
    padding: bm.composerPad,
  },
  input: {
    flex: 1,
    minHeight: bm.inputMinHeight,
    maxHeight: bm.inputMaxHeight,
    borderRadius: bm.inputRadius,
    paddingHorizontal: bm.inputPadH,
    fontSize: bm.bubbleFont,
  },
  send: {
    width: bm.sendSize,
    height: bm.sendSize,
    borderRadius: bm.sendSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
