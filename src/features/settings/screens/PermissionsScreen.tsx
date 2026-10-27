/**
 * Contrôle des permissions — ouverture des réglages système.
 */
import React, {useCallback, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import {Bell} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';

type Props = {onBack: () => void};

type PermStatus = 'granted' | 'denied' | 'unknown';

export function PermissionsScreen({onBack}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const [notifStatus, setNotifStatus] = useState<PermStatus>('unknown');

  const refresh = useCallback(() => {
    // Sans module permissions dédié ici : statut inconnu jusqu'aux réglages système.
    // L'utilisateur bascule dans les settings OS puis revient.
    setNotifStatus('unknown');
  }, []);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') refresh();
    });
    return () => sub.remove();
  }, [refresh]);

  const openSystemSettings = () => {
    if (Platform.OS === 'android') {
      fireAndForgetLinking(Linking.openSettings());
    } else {
      fireAndForgetLinking(Linking.openURL('app-settings:'));
    }
  };

  const statusLabel =
    notifStatus === 'granted'
      ? t.permStatusGranted
      : notifStatus === 'denied'
        ? t.permStatusDenied
        : t.permStatusUnknown;

  return (
    <SettingsShell title={t.permissionsTitle} onBack={onBack}>
      <View style={styles.body}>
        <View
          style={[
            styles.card,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <View style={styles.row}>
            <View style={[styles.icon, styles.iconNotif]}>
              <Bell size={sm.iconInner} color={colors.white} />
            </View>
            <View style={styles.labels}>
              <Text style={[styles.title, {color: colors.textPrimary}]}>
                {t.permNotifications}
              </Text>
              <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
                {t.permNotificationsSub}
              </Text>
              <Text style={[styles.status, {color: colors.textHint}]}>
                {statusLabel}
              </Text>
            </View>
          </View>
        </View>

        <Pressable
          onPress={openSystemSettings}
          style={({pressed}) => [
            styles.cta,
            {
              backgroundColor: colors.accent,
              opacity: pressed ? 0.9 : 1,
            },
          ]}>
          <Text style={[styles.ctaText, {color: colors.white}]}>
            {t.permOpenSettings}
          </Text>
        </Pressable>
      </View>
    </SettingsShell>
  );
}

function fireAndForgetLinking(p: Promise<unknown>): void {
  p.catch(() => {
    // ignore
  });
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: sm.cardMarginH,
    paddingTop: 16,
    gap: 16,
  },
  card: {
    borderRadius: sm.cardRadius,
    padding: 14,
  },
  row: {flexDirection: 'row', gap: 12, alignItems: 'center'},
  icon: {
    width: sm.iconSize,
    height: sm.iconSize,
    borderRadius: sm.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconNotif: {backgroundColor: '#E74C3C'},
  status: {fontSize: 12, marginTop: 4},
  labels: {flex: 1},
  title: {fontSize: sm.titleSize, fontWeight: '600'},
  cta: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
  },
  ctaText: {fontSize: 16, fontWeight: '700'},
});
