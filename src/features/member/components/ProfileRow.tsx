/**
 * Ligne d'info profil — MemberProfilePage.css .mp-row.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronRight} from 'lucide-react-native';
import {useTheme, memberProfileMetrics as m} from '../../../shared/theme';

type Tone = 'accent' | 'good' | 'danger';

type Props = {
  icon: React.ReactNode;
  tone?: Tone;
  label: string;
  value: React.ReactNode;
  onPress?: () => void;
  valueDanger?: boolean;
};

export function ProfileRow({
  icon,
  tone = 'accent',
  label,
  value,
  onPress,
  valueDanger,
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

  const content = (
    <>
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
        <View style={styles.valWrap}>
          {typeof value === 'string' ? (
            <Text
              style={[
                styles.val,
                {
                  color: valueDanger ? colors.danger : colors.textPrimary,
                },
              ]}>
              {value}
            </Text>
          ) : (
            value
          )}
        </View>
      </View>
      {onPress ? (
        <ChevronRight size={16} color={colors.textHint} />
      ) : null}
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({pressed}) => [
          styles.row,
          pressed && {backgroundColor: colors.bgSecondary},
        ]}>
        {content}
      </Pressable>
    );
  }
  return <View style={styles.row}>{content}</View>;
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
  valWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  val: {
    fontSize: m.rowValSize,
    fontWeight: '600',
  },
});
