import React, {useCallback, useState} from 'react';
import {View, Text, Pressable, ScrollView, StyleSheet} from 'react-native';
import {Download} from 'lucide-react-native';
import {useTheme, fontSize, radii} from '../../../shared/theme';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {useAuthStore} from '../store/authStore';
import {useUpdateStore} from '../../update/updateStore';
import {updateTexts as t} from '../../update/texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

export function UpgradeScreen(): React.JSX.Element {
  const upgradeLatest = useAuthStore(s => s.upgradeLatest);
  const boot = useAuthStore(s => s.boot);
  const latest = useUpdateStore(s => s.latest);
  const checking = useUpdateStore(s => s.checking);
  const check = useUpdateStore(s => s.check);
  const openDownload = useUpdateStore(s => s.openDownload);
  const {colors} = useTheme();
  const [message, setMessage] = useState<string | null>(null);

  const version = latest?.version_name ?? upgradeLatest;
  const hasLink = !!latest?.download_url;

  const onUpdate = useCallback(() => {
    setMessage(null);
    fireAndForget(
      openDownload().then(ok => {
        if (!ok) setMessage(t.openFailed);
      }),
    );
  }, [openDownload]);

  const onCheckAgain = useCallback(() => {
    setMessage(null);
    fireAndForget(
      check(true).then(() => {
        const s = useUpdateStore.getState();
        if (s.level !== 'required') {
          // Plus de mise à jour obligatoire : on relance le démarrage normal.
          useAuthStore.setState({state: 'booting'});
          fireAndForget(boot());
        } else if (!s.latest?.download_url) {
          setMessage(t.noLink);
        }
      }),
    );
  }, [check, boot]);

  return (
    <View style={[styles.outer, {backgroundColor: colors.bgSecondary}]}>
      <StatusBarStrip />
      <ScrollView contentContainerStyle={styles.root}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{t.blockedTitle}</Text>
        <Text style={[styles.body, {color: colors.textSecondary}]}>{t.blockedBody}</Text>
        {version ? (
          <Text style={[styles.latest, {color: colors.accent}]}>{t.version(version)}</Text>
        ) : null}
        {latest?.notes ? (
          <View style={[styles.notes, {backgroundColor: colors.bgPrimary}]}>
            <Text style={[styles.notesTitle, {color: colors.textPrimary}]}>{t.notes}</Text>
            <Text style={[styles.notesBody, {color: colors.textSecondary}]}>{latest.notes}</Text>
          </View>
        ) : null}
        {hasLink ? (
          <Pressable
            accessibilityRole="button"
            onPress={onUpdate}
            style={[styles.primary, {backgroundColor: colors.accent}]}>
            <Download size={18} color={colors.white} />
            <Text style={[styles.primaryText, {color: colors.white}]}>{t.update}</Text>
          </Pressable>
        ) : null}
        <Pressable
          accessibilityRole="button"
          onPress={onCheckAgain}
          disabled={checking}
          style={styles.secondary}>
          <Text style={{color: colors.accent, fontSize: fontSize.listSubtitle}}>
            {checking ? t.checking : t.checkAgain}
          </Text>
        </Pressable>
        {message ? (
          <Text style={[styles.message, {color: colors.textSecondary}]}>{message}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {flex: 1},
  root: {flexGrow: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  title: {fontSize: fontSize.pageHeader, fontWeight: '700', marginBottom: 16, textAlign: 'center'},
  body: {fontSize: fontSize.listSubtitle, textAlign: 'center'},
  latest: {marginTop: 12},
  notes: {marginTop: 20, padding: 14, borderRadius: radii.navPill, alignSelf: 'stretch'},
  notesTitle: {fontWeight: '700', marginBottom: 6},
  notesBody: {fontSize: 14},
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 24,
    paddingHorizontal: 28,
    height: 48,
    borderRadius: 24,
  },
  primaryText: {fontSize: fontSize.listSubtitle, fontWeight: '700'},
  secondary: {marginTop: 16, padding: 8},
  message: {marginTop: 8, textAlign: 'center', fontSize: 13},
});
