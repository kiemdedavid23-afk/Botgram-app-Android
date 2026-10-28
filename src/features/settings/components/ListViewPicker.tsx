/**
 * « Vue de la liste des échanges » : deux lignes / trois lignes (boutons radio).
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import {SettingsCard, CardTitle} from './ui';

type Density = 'two' | 'three';

export function ListViewPicker(): React.JSX.Element {
  const {appearance, setAppearance} = useTheme();
  return (
    <SettingsCard>
      <CardTitle>{t.listViewCard}</CardTitle>
      <View style={styles.row}>
        <Option
          label={t.densityTwo}
          lines={2}
          active={appearance.listDensity === 'two'}
          onPress={() => setAppearance({listDensity: 'two' as Density})}
        />
        <Option
          label={t.densityThree}
          lines={3}
          active={appearance.listDensity === 'three'}
          onPress={() => setAppearance({listDensity: 'three' as Density})}
        />
      </View>
    </SettingsCard>
  );
}

const TRANSPARENT = 'transparent';

function Option({
  label,
  lines,
  active,
  onPress,
}: {
  label: string;
  lines: 2 | 3;
  active: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  const boxBorder = active ? colors.border : TRANSPARENT;
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{selected: active}}
      accessibilityLabel={label}
      onPress={onPress}
      style={styles.option}>
      <View
        style={[
          styles.box,
          {
            backgroundColor: active ? colors.bgPrimary : colors.bgSecondary,
            borderColor: boxBorder,
          },
        ]}>
        <View style={styles.rows}>
          {[0, 1].map(i => (
            <View key={i} style={styles.item}>
              <View
                style={[styles.avatar, {backgroundColor: i ? colors.bgTertiary : colors.textHint}]}
              />
              <View style={styles.lines}>
                <View style={[styles.line, styles.lineShort, {backgroundColor: colors.textHint}]} />
                {Array.from({length: lines - 1}).map((_, k) => (
                  <View key={k} style={[styles.line, {backgroundColor: colors.bgTertiary}]} />
                ))}
              </View>
            </View>
          ))}
        </View>
        <View style={[styles.radio, {borderColor: active ? colors.accent : colors.textHint}]}>
          {active ? <View style={[styles.dot, {backgroundColor: colors.accent}]} /> : null}
        </View>
      </View>
      <Text style={[styles.label, {color: colors.textPrimary}]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 12, padding: 14, paddingTop: 10},
  option: {flex: 1, alignItems: 'center', gap: 10},
  box: {
    width: '100%',
    height: 78,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    gap: 8,
  },
  rows: {flex: 1, gap: 8},
  item: {flexDirection: 'row', alignItems: 'center', gap: 8},
  avatar: {width: 22, height: 22, borderRadius: 11},
  lines: {flex: 1, gap: 3},
  line: {height: 4, borderRadius: 2},
  lineShort: {width: '45%'},
  radio: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {width: 12, height: 12, borderRadius: 6},
  label: {fontSize: 16},
});
