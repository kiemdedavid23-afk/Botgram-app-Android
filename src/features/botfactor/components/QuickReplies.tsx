import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import type {QuickReply} from '../types';

type Props = {
  actions: QuickReply[];
  disabled: boolean;
  onPick: (q: QuickReply) => void;
};

export function QuickReplies({actions, disabled, onPick}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      {actions.map(a => (
        <Pressable
          key={`${a.value}|${a.label}`}
          disabled={disabled}
          onPress={() => onPick(a)}
          style={[
            styles.chip,
            {backgroundColor: colors.accentSoft, opacity: disabled ? 0.5 : 1},
          ]}>
          <Text style={[styles.label, {color: colors.accent}]}>{a.label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flexDirection: 'row', flexWrap: 'wrap', gap: bm.chipGap},
  chip: {
    paddingHorizontal: bm.chipPadH,
    paddingVertical: bm.chipPadV,
    borderRadius: bm.chipRadius,
  },
  label: {fontSize: bm.chipFont},
});
