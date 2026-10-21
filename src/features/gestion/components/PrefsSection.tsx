/**
 * Préférences d'interface — thème, langue, fuseau.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Palette, Languages, Clock} from 'lucide-react-native';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import {texts} from '../texts';
import {
  TIMEZONES,
  timezoneLabel,
  deviceTimezone,
} from '../utils/format';

type Props = {
  timezone: string;
  onTimezoneCycle: () => void;
  onLanguagePress: () => void;
};

export function PrefsSection({
  timezone,
  onTimezoneCycle,
  onLanguagePress,
}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();
  const themeMode = appearance.followSystemTheme
    ? 'system'
    : mode === 'dark'
      ? 'dark'
      : 'light';

  const cycleTheme = () => {
    const next =
      themeMode === 'light' ? 'dark' : themeMode === 'dark' ? 'system' : 'light';
    if (next === 'system') {
      setAppearance({...appearance, followSystemTheme: true});
    } else {
      setAppearance({
        ...appearance,
        followSystemTheme: false,
        theme: next,
      });
    }
  };

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
        {texts.sectionPrefs}
      </Text>
      <View
        style={[
          styles.prefCard,
          {backgroundColor: colors.bgPrimary},
          getShadow('sm', mode),
        ]}>
        <PrefRow
          icon={<Palette size={18} color={colors.accent} />}
          label={texts.theme}
          value={
            themeMode === 'system'
              ? texts.themeSystem
              : themeMode === 'dark'
                ? texts.themeDark
                : texts.themeLight
          }
          onPress={cycleTheme}
        />
        <PrefRow
          icon={<Languages size={18} color={colors.accent} />}
          label={texts.language}
          value={texts.languageFr}
          onPress={onLanguagePress}
        />
        <PrefRow
          icon={<Clock size={18} color={colors.accent} />}
          label={texts.timezone}
          value={
            timezone === 'auto'
              ? `${texts.timezoneAuto} (${timezoneLabel(deviceTimezone())})`
              : timezoneLabel(timezone)
          }
          onPress={onTimezoneCycle}
        />
      </View>
    </View>
  );
}

function PrefRow({
  icon,
  label,
  value,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  onPress: () => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable onPress={onPress} style={styles.prefRow}>
      <View style={[styles.prefIcon, {backgroundColor: colors.accentSoft}]}>
        {icon}
      </View>
      <View style={styles.prefLabels}>
        <Text style={{color: colors.textSecondary, fontSize: 12}}>{label}</Text>
        <Text style={{color: colors.textPrimary, fontWeight: '600'}}>
          {value}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  section: {gap: 10},
  sectionTitle: {
    fontSize: g.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: g.sectionTitleLetter * g.sectionTitleSize,
    textTransform: 'uppercase',
    paddingHorizontal: g.sectionHeadPadH,
  },
  prefCard: {borderRadius: g.cardRadius, overflow: 'hidden'},
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: g.prefRowPadV,
    paddingHorizontal: g.prefRowPadH,
  },
  prefIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  prefLabels: {flex: 1},
});

