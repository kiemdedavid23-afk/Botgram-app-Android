/**
 * Permissions — état réel de l'autorisation de notifications (Android 13+),
 * demande directe, puis réglages système si elle est refusée définitivement.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  Text,
  ScrollView,
  StyleSheet,
  Linking,
  Platform,
  AppState,
  PermissionsAndroid,
} from 'react-native';
import {Bell, Settings} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, LinkRow} from '../components/ui';

type Props = {onBack: () => void};

type PermStatus = 'granted' | 'denied' | 'unknown';

const NOTIF_MIN_API = 33;

async function readNotificationStatus(): Promise<PermStatus> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < NOTIF_MIN_API) {
    return 'unknown';
  }
  try {
    const ok = await PermissionsAndroid.check(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    return ok ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

export function PermissionsScreen({onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [status, setStatus] = useState<PermStatus>('unknown');

  const refresh = useCallback(() => {
    fireAndForget(readNotificationStatus().then(setStatus));
  }, []);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const openSystemSettings = () => {
    fireAndForget(
      Platform.OS === 'android'
        ? Linking.openSettings()
        : Linking.openURL('app-settings:'),
    );
  };

  const allow = async () => {
    const res = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
    );
    if (res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
      openSystemSettings();
    }
    refresh();
  };

  const label =
    status === 'granted'
      ? t.permStatusGranted
      : status === 'denied'
        ? t.permStatusDenied
        : t.permStatusUnknown;
  const statusColor =
    status === 'granted'
      ? colors.success
      : status === 'denied'
        ? colors.danger
        : colors.textHint;

  return (
    <SettingsPage title={t.permissionsTitle} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <SettingsCard>
          <CardTitle>{t.permNotifications}</CardTitle>
          <LinkRow
            Icon={Bell}
            label={status === 'denied' ? t.permAllow : t.permNotifications}
            onPress={status === 'denied' ? () => fireAndForget(allow()) : undefined}
            trailing={
              <Text style={[styles.status, {color: statusColor}]}>{label}</Text>
            }
          />
          <LinkRow
            Icon={Settings}
            label={t.permOpenSettings}
            last
            onPress={openSystemSettings}
          />
        </SettingsCard>
        <Text style={[styles.hint, {color: colors.textSecondary}]}>
          {t.permNotificationsSub}
        </Text>
      </ScrollView>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingTop: 12, paddingBottom: 24, gap: 12},
  status: {fontSize: 15, fontWeight: fontWeight.semibold},
  hint: {fontSize: 13, paddingHorizontal: 32, marginTop: -4},
});
