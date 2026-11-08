/**
 * Briques visuelles communes des pages Paramètres : cartes, titres de carte, lignes d'action à icône.
 * Elles lisent la palette (useSettingsPalette) : habillage entreprise ou Botgram.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import type {LucideIcon} from 'lucide-react-native';
import {settingsMetrics as sm, fontWeight} from '../../../shared/theme';
import {useSettingsPalette} from './settingsPalette';

export function SettingsCard({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}): React.JSX.Element {
  const p = useSettingsPalette();
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: p.surface, marginHorizontal: p.cardMarginH, borderRadius: p.cardRadius},
        p.company
          ? {
              borderWidth: 1,
              borderColor: p.cardBorder,
              shadowColor: p.shadow,
              shadowOpacity: p.shadowOpacity,
              shadowRadius: 18,
              shadowOffset: {width: 0, height: 8},
              elevation: 3,
            }
          : null,
        style,
      ]}>
      {children}
    </View>
  );
}

export function CardTitle({children}: {children: string}): React.JSX.Element {
  const p = useSettingsPalette();
  return (
    <Text
      style={[
        styles.cardTitle,
        {color: p.titleColor, fontSize: p.titleSize, fontFamily: p.titleFont},
        p.company ? styles.cardTitleCompany : null,
      ]}>
      {children}
    </Text>
  );
}

export function RowDivider(): React.JSX.Element {
  const p = useSettingsPalette();
  return <View style={[styles.divider, {backgroundColor: p.line}]} />;
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
  const p = useSettingsPalette();
  const tint = danger ? p.danger : p.accent;
  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        disabled={!onPress}
        android_ripple={{color: p.accentSoft}}
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
  cardTitleCompany: {fontWeight: '700', letterSpacing: -0.2, paddingTop: 20, paddingBottom: 8},
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
