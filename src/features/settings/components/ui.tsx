/**
 * Briques visuelles communes des pages Paramètres (style de référence) :
 * cartes blanches à plat, titres de carte en bleu, lignes d'action à icône.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm, fontWeight} from '../../../shared/theme';

export function SettingsCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.card, {backgroundColor: colors.bgPrimary}, style]}>
      {children}
    </View>
  );
}

export function CardTitle({children}: {children: string}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Text style={[styles.cardTitle, {color: colors.accent}]}>{children}</Text>
  );
}

export function RowDivider(): React.JSX.Element {
  const {colors} = useTheme();
  return <View style={[styles.divider, {backgroundColor: colors.borderSoft}]} />;
}

type LinkRowProps = {
  Icon: LucideIcon;
  label: string;
  onPress?: () => void;
  trailing?: React.ReactNode;
  /** Pas de séparateur sous la ligne. */
  last?: boolean;
  danger?: boolean;
};

export function LinkRow({
  Icon,
  label,
  onPress,
  trailing,
  last,
  danger,
}: LinkRowProps): React.JSX.Element {
  const {colors} = useTheme();
  const tint = danger ? colors.danger : colors.accent;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={!onPress}
        android_ripple={{color: colors.accentSoft}}
        style={styles.row}>
        <Icon size={24} color={tint} strokeWidth={1.75} />
        <Text style={[styles.rowLabel, {color: tint}]} numberOfLines={1}>
          {label}
        </Text>
        {trailing}
      </Pressable>
      {last ? null : <RowDivider />}
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: sm.cardMarginH,
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 6,
  },
  divider: {height: StyleSheet.hairlineWidth, marginLeft: 68},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 20,
    minHeight: 52,
    paddingHorizontal: 20,
  },
  rowLabel: {flex: 1, fontSize: 17},
});
