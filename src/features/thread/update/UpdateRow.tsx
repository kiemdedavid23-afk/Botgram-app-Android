/** Ligne « Mises à jour » des réglages : version actuelle, recherche, lien de téléchargement. */
import React, {useCallback} from 'react';
import {Pressable, View, Text, ActivityIndicator, StyleSheet} from 'react-native';
import {RefreshCw} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm} from '../../shared/theme';
import {env} from '../../core/config/env';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {useUpdateStore} from './updateStore';
import {updateTexts as t} from './texts';

export function UpdateRow(): React.JSX.Element {
  const {colors} = useTheme();
  const level = useUpdateStore(s => s.level);
  const latest = useUpdateStore(s => s.latest);
  const checking = useUpdateStore(s => s.checking);
  const result = useUpdateStore(s => s.result);
  const check = useUpdateStore(s => s.check);
  const openDownload = useUpdateStore(s => s.openDownload);

  const available = level !== 'none';
  const onPress = useCallback(() => {
    if (available && latest?.download_url) {
      fireAndForget(openDownload());
    } else {
      fireAndForget(check(true));
    }
  }, [available, latest, openDownload, check]);

  let sub = t.settingsCurrent(env.appVersion, env.appBuild);
  if (checking) sub = t.settingsChecking;
  else if (available) sub = t.settingsAvailable(latest?.version_name ?? null);
  else if (result === 'uptodate') sub = t.settingsUpToDate(env.appVersion);
  else if (result === 'failed') sub = t.settingsFailed;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={checking}
      style={({pressed}) => [styles.row, pressed && {backgroundColor: colors.bgSecondary}]}>
      <View style={[styles.icon, {backgroundColor: colors.accent}]}>
        {checking ? (
          <ActivityIndicator size="small" color={colors.white} />
        ) : (
          <RefreshCw size={sm.iconInner} color={colors.white} />
        )}
      </View>
      <View style={styles.labels}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{t.settingsTitle}</Text>
        <Text style={[styles.sub, {color: available ? colors.accent : colors.textSecondary}]}>
          {sub}
        </Text>
      </View>
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
  labels: {flex: 1, gap: 2},
  title: {fontSize: sm.titleSize, fontWeight: sm.titleWeight},
  sub: {fontSize: sm.subSize},
});
