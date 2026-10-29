/**
 * Permissions — état réel des autorisations (notifications Android 13+, micro),
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
  type Permission,
} from 'react-native';
import {Bell, Mic, Settings, type LucideIcon} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, LinkRow} from '../components/ui';

type Props = {onBack: () => void};

type PermStatus = 'granted' | 'denied' | 'unknown';

const NOTIF_MIN_API = 33;
const MIC_MIN_API = 23;

async function readStatus(
  permission: Permission,
  minApi: number,
): Promise<PermStatus> {
  if (Platform.OS !== 'android' || Number(Platform.Version) < minApi) {
    return 'unknown';
  }
  try {
    const ok = await PermissionsAndroid.check(permission);
    return ok ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

function openSystemSettings(): void {
  fireAndForget(
    Platform.OS === 'android'
      ? Linking.openSettings()
      : Linking.openURL('app-settings:'),
  );
}

type BlockProps = {
  permission: Permission;
  minApi: number;
  title: string;
  subtitle: string;
  Icon: LucideIcon;
};

/** Une permission : titre, ligne d'état (touchable si refusée) et sous-titre. */
function PermissionBlock({
  permission,
  minApi,
  title,
  subtitle,
  Icon,
}: BlockProps): React.JSX.Element {
  const {colors} = useTheme();
  const [status, setStatus] = useState<PermStatus>('unknown');

  const refresh = useCallback(() => {
    fireAndForget(readStatus(permission, minApi).then(setStatus));
  }, [permission, minApi]);

  useEffect(() => {
    refresh();
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
      }
    });
    return () => sub.remove();
  }, [refresh]);

  const allow = async () => {
    const res = await PermissionsAndroid.request(permission);
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
    <>
      <SettingsCard>
        <CardTitle>{title}</CardTitle>
        <LinkRow
          Icon={Icon}
          label={status === 'denied' ? t.permAllow : title}
          last
          onPress={status === 'denied' ? () => fireAndForget(allow()) : undefined}
          trailing={
            <Text style={[styles.status, {color: statusColor}]}>{label}</Text>
          }
        />
      </SettingsCard>
      <Text style={[styles.hint, {color: colors.textSecondary}]}>{subtitle}</Text>
    </>
  );
}

export function PermissionsScreen({onBack}: Props): React.JSX.Element {
  return (
    <SettingsPage title={t.permissionsTitle} onBack={onBack}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <PermissionBlock
          permission={PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS}
          minApi={NOTIF_MIN_API}
          title={t.permNotifications}
          subtitle={t.permNotificationsSub}
          Icon={Bell}
        />
        <PermissionBlock
          permission={PermissionsAndroid.PERMISSIONS.RECORD_AUDIO}
          minApi={MIC_MIN_API}
          title={t.permMicrophone}
          subtitle={t.permMicrophoneSub}
          Icon={Mic}
        />
        <SettingsCard>
          <LinkRow
            Icon={Settings}
            label={t.permOpenSettings}
            last
            onPress={openSystemSettings}
          />
        </SettingsCard>
      </ScrollView>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingTop: 12, paddingBottom: 24, gap: 12},
  status: {fontSize: 15, fontWeight: fontWeight.semibold},
  hint: {fontSize: 13, paddingHorizontal: 32, marginTop: -4},
});

