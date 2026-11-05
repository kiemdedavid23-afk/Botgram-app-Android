/**
 * Section « Application » de la page Gestion : version actuelle, recherche de mise à jour,
 * téléchargement et installation (canal direct).
 */
import React, {useCallback} from 'react';
import {View, Text, Pressable, ActivityIndicator, StyleSheet} from 'react-native';
import {RefreshCw} from 'lucide-react-native';
import {
  useTheme,
  gestionMetrics as g,
  getShadow,
  fontWeight,
  updateMetrics as um,
} from '../../shared/theme';
import {env} from '../../core/config/env';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {useUpdateStore} from './updateStore';
import {updateTexts as t} from './texts';
import {installStatusText} from './statusText';

export function UpdateRow(): React.JSX.Element {
  const {colors, mode} = useTheme();
  const level = useUpdateStore(s => s.level);
  const latest = useUpdateStore(s => s.latest);
  const checking = useUpdateStore(s => s.checking);
  const result = useUpdateStore(s => s.result);
  const check = useUpdateStore(s => s.check);
  const startUpdate = useUpdateStore(s => s.startUpdate);
  const phase = useUpdateStore(s => s.installPhase);
  const progress = useUpdateStore(s => s.progress);
  const installError = useUpdateStore(s => s.installError);

  const available = level !== 'none';
  const busy = checking || phase === 'downloading' || phase === 'installing';

  const onPress = useCallback(() => {
    if (available && latest?.download_url) {
      fireAndForget(startUpdate());
    } else {
      fireAndForget(check(true));
    }
  }, [available, latest, startUpdate, check]);

  let sub = installStatusText(phase, progress, installError);
  if (sub == null) {
    if (checking) sub = t.settingsChecking;
    else if (available) sub = t.settingsAvailable(latest?.version_name ?? null);
    else if (result === 'uptodate') sub = t.settingsUpToDate(env.appVersion);
    else if (result === 'failed') sub = t.settingsFailed;
    else sub = t.settingsCurrent(env.appVersion, env.appBuild);
  }

  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
        {t.sectionTitle}
      </Text>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}, getShadow('sm', mode)]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={available ? t.updateA11y : t.checkA11y}
          onPress={onPress}
          disabled={busy}
          style={styles.row}>
          <View style={[styles.icon, {backgroundColor: colors.accentSoft}]}>
            {busy ? (
              <ActivityIndicator size="small" color={colors.accent} />
            ) : (
              <RefreshCw size={um.iconSize} color={colors.accent} />
            )}
          </View>
          <View style={styles.labels}>
            <Text style={[styles.label, {color: colors.textSecondary}]}>{t.settingsTitle}</Text>
            <Text
              style={[styles.value, {color: available ? colors.accent : colors.textPrimary}]}>
              {sub}
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: 10},
  sectionTitle: {
    fontSize: g.sectionTitleSize,
    fontWeight: fontWeight.bold,
    letterSpacing: g.sectionTitleLetter * g.sectionTitleSize,
    textTransform: 'uppercase',
    paddingHorizontal: g.sectionHeadPadH,
  },
  card: {borderRadius: g.cardRadius, overflow: 'hidden'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: um.bannerGap,
    paddingVertical: g.prefRowPadV,
    paddingHorizontal: g.prefRowPadH,
  },
  icon: {
    width: um.iconBox,
    height: um.iconBox,
    borderRadius: um.rowIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {flex: 1},
  label: {fontSize: g.prefLabelFont},
  value: {fontWeight: fontWeight.semibold},
});
