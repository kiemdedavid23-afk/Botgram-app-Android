/** Bannière « nouvelle version » (niveau optional) : Mettre à jour / Plus tard. */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Download} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  getShadow,
  radii,
  fontWeight,
  updateMetrics as um,
} from '../../shared/theme';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {useAuthStore} from '../auth/store/authStore';
import {useUpdateStore} from './updateStore';
import {updateTexts as t} from './texts';
import {installStatusText} from './statusText';

export function UpdateBanner(): React.JSX.Element | null {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const signedIn = useAuthStore(s => s.state === 'signedIn');
  const level = useUpdateStore(s => s.level);
  const latest = useUpdateStore(s => s.latest);
  const dismissedCode = useUpdateStore(s => s.dismissedCode);
  const dismiss = useUpdateStore(s => s.dismiss);
  const startUpdate = useUpdateStore(s => s.startUpdate);
  const cancelUpdate = useUpdateStore(s => s.cancelUpdate);
  const phase = useUpdateStore(s => s.installPhase);
  const progress = useUpdateStore(s => s.progress);
  const installError = useUpdateStore(s => s.installError);

  const code = latest?.version_code ?? -1;
  const status = installStatusText(phase, progress, installError);
  if (!signedIn || level !== 'optional' || dismissedCode === code) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, {top: insets.top + um.bannerTopGap}]}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}, getShadow('md', mode)]}>
        <View style={[styles.icon, {backgroundColor: colors.accent}]}>
          <Download size={um.iconSize} color={colors.white} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>{t.bannerTitle}</Text>
          <Text style={[styles.sub, {color: colors.textSecondary}]} numberOfLines={2}>
            {status ??
              (latest?.version_name
                ? t.bannerVersion(latest.version_name)
                : t.bannerBody)}
          </Text>
          <View style={styles.actions}>
            {latest?.download_url && phase !== 'installing' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={
                  phase === 'downloading' ? t.cancelA11y : t.updateA11y
                }
                onPress={phase === 'downloading' ? cancelUpdate : () => fireAndForget(startUpdate())}>
                <Text style={[styles.action, {color: colors.accent}]}>
                  {phase === 'downloading' ? t.cancel : phase === 'error' ? t.retry : t.update}
                </Text>
              </Pressable>
            ) : null}
            {phase !== 'downloading' ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t.laterA11y}
                onPress={dismiss}>
                <Text style={[styles.action, {color: colors.textSecondary}]}>{t.later}</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {position: 'absolute', left: um.bannerInset, right: um.bannerInset},
  card: {
    flexDirection: 'row',
    gap: um.bannerGap,
    padding: um.bannerPad,
    borderRadius: radii.navPill,
  },
  icon: {
    width: um.iconBox,
    height: um.iconBox,
    borderRadius: um.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1},
  title: {fontSize: um.titleFont, fontWeight: fontWeight.bold},
  sub: {fontSize: um.subFont, marginTop: um.subGap},
  actions: {flexDirection: 'row', gap: um.actionsGap, marginTop: um.actionsTop},
  action: {fontSize: um.actionFont, fontWeight: fontWeight.bold},
});
