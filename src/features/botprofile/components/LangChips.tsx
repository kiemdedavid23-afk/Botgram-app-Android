import React from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {langLabel} from '../utils/languages';

type Props = {
  languages: string[];
  active: string;
  onSelect: (lang: string) => void;
};

export function LangChips({languages, active, onSelect}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
      <View style={styles.row}>
        {languages.map(code => {
          const on = code === active;
          return (
            <Pressable
              key={code}
              onPress={() => onSelect(code)}
              style={[
                styles.chip,
                {
                  backgroundColor: on ? colors.accent : colors.bgTertiary,
                },
              ]}>
              <Text
                style={[
                  styles.chipText,
                  {color: on ? colors.white : colors.textPrimary},
                ]}>
                {langLabel(code)}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: m.chipRowGap},
  chip: {
    paddingVertical: m.chipPadV,
    paddingHorizontal: m.chipPadH,
    borderRadius: m.chipRadius,
  },
  chipText: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight},
});
