/** Bannière « nouvelle version » (niveau optional) : Mettre à jour / Plus tard. */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Download} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, getShadow, radii, fontWeight} from '../../shared/theme';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {useAuthStore} from '../auth/store/authStore';
import {useUpdateStore} from './updateStore';
import {updateTexts as t} from './texts';

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
  if (!signedIn || level !== 'optional' || dismissedCode === code) return null;

  return (
    <View
      pointerEvents="box-none"
      style={[styles.wrap, {top: insets.top + 8}]}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}, getShadow('md', mode)]}>
        <View style={[styles.icon, {backgroundColor: colors.accent}]}>
          <Download size={18} color={colors.white} />
        </View>
        <View style={styles.text}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>{t.bannerTitle}</Text>
          <Text style={[styles.sub, {color: colors.textSecondary}]} numberOfLines={2}>
            {phase === 'downloading'
              ? t.downloading(progress > 0 ? Math.round(progress * 100) : null)
              : phase === 'installing'
                ? t.installing
                : phase === 'needsPermission'
                  ? t.needsPermission
                  : phase === 'error' && installError
                    ? installError
                    : latest?.version_name
                      ? t.bannerVersion(latest.version_name)
                      : t.bannerBody}
          </Text>
          <View style={styles.actions}>
            {latest?.download_url && phase !== 'installing' ? (
              <Pressable
                accessibilityRole="button"
                onPress={phase === 'downloading' ? cancelUpdate : () => fireAndForget(startUpdate())}>
                <Text style={[styles.action, {color: colors.accent}]}>
                  {phase === 'downloading' ? t.cancel : phase === 'error' ? t.retry : t.update}
                </Text>
              </Pressable>
            ) : null}
            {phase !== 'downloading' ? (
              <Pressable accessibilityRole="button" onPress={dismiss}>
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
  wrap: {position: 'absolute', left: 12, right: 12},
  card: {flexDirection: 'row', gap: 12, padding: 12, borderRadius: radii.navPill},
  icon: {width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center'},
  text: {flex: 1},
  title: {fontSize: 15, fontWeight: fontWeight.bold},
  sub: {fontSize: 13, marginTop: 2},
  actions: {flexDirection: 'row', gap: 24, marginTop: 8},
  action: {fontSize: 14, fontWeight: fontWeight.bold},
});
