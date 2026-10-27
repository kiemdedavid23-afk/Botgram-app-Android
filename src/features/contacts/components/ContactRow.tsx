/**
 * Ligne d'info profil contact — même structure visuelle que ProfileRow membre.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, memberProfileMetrics as m} from '../../../shared/theme';

type Tone = 'accent' | 'good' | 'danger';

type Props = {
  icon: React.ReactNode;
  tone?: Tone;
  label: string;
  value: string;
};

export function ContactRow({
  icon,
  tone = 'accent',
  label,
  value,
}: Props): React.JSX.Element {
  const {colors} = useTheme();

  const iconBg =
    tone === 'good'
      ? colors.rowIconGoodBg
      : tone === 'danger'
        ? colors.rowIconDangerBg
        : colors.accentSoft;
  const iconColor =
    tone === 'good'
      ? colors.online
      : tone === 'danger'
        ? colors.danger
        : colors.accent;

  return (
    <View style={styles.row}>
      <View style={[styles.icon, {backgroundColor: iconBg}]}>
        {React.isValidElement(icon)
          ? React.cloneElement(
              icon as React.ReactElement<{color?: string; size?: number}>,
              {color: iconColor, size: 18},
            )
          : icon}
      </View>
      <View style={styles.info}>
        <Text style={[styles.key, {color: colors.textSecondary}]}>{label}</Text>
        <Text style={[styles.val, {color: colors.textPrimary}]} numberOfLines={2}>
          {value}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
    paddingVertical: m.rowPadV,
    paddingHorizontal: m.rowPadH,
  },
  icon: {
    width: m.rowIcon,
    height: m.rowIcon,
    borderRadius: m.rowIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    minWidth: 0,
    gap: 1,
  },
  key: {
    fontSize: m.rowKeySize,
  },
  val: {
    fontSize: m.rowValSize,
    fontWeight: '600',
  },
});
