import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';

type Props = {
  title: string;
  count?: number;
};

export function SectionHeader({title, count}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[styles.label, {color: colors.textHint}]}>{title}</Text>
      {count !== undefined ? (
        <View style={[styles.badge, {backgroundColor: colors.accentSoft}]}>
          <Text style={[styles.badgeText, {color: colors.accent}]}>{count}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: dm.sectionLabelPadH,
    gap: dm.sectionHeadGap,
  },
  label: {
    fontSize: dm.sectionLabelSize,
    fontWeight: dm.weight700,
    letterSpacing: 0.08 * dm.sectionLabelSize,
    textTransform: 'uppercase',
  },
  badge: {
    borderRadius: 99,
    paddingVertical: dm.countPadV,
    paddingHorizontal: dm.countPadH,
  },
  badgeText: {
    fontSize: dm.sectionLabelSize,
    fontWeight: dm.weight700,
    fontVariant: ['tabular-nums'],
  },
});
