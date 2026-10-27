import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm, fontWeight} from '../../../shared/theme';

type Props = {
  icon: React.ReactNode;
  iconBg: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
};

export function SettingsHubRow({
  icon,
  iconBg,
  title,
  subtitle,
  onPress,
  trailing,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={({pressed}) => [
        styles.row,
        pressed && onPress ? {backgroundColor: colors.bgSecondary} : null,
      ]}>
      <View style={[styles.icon, {backgroundColor: iconBg}]}>
        {icon}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
        {subtitle ? (
          <Text style={[styles.sub, {color: colors.textSecondary}]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {trailing ??
        (onPress ? (
          <ChevronRight size={18} color={colors.textHint} />
        ) : null)}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sm.rowGap,
    paddingVertical: sm.rowPadV,
    paddingHorizontal: sm.rowPadH,
  },
  icon: {
    width: sm.iconSize,
    height: sm.iconSize,
    borderRadius: sm.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {flex: 1, gap: 2, minWidth: 0},
  title: {fontSize: sm.titleSize, fontWeight: fontWeight.semibold},
  sub: {fontSize: sm.subSize},
});
