import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, fontSize} from '../../../shared/theme';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {texts} from '../texts';
import {useAuthStore} from '../store/authStore';

export function UpgradeScreen(): React.JSX.Element {
  const latest = useAuthStore(s => s.upgradeLatest);
  const {colors} = useTheme();
  return (
    <View style={[styles.outer, {backgroundColor: colors.bgSecondary}]}>
      <StatusBarStrip />
      <View style={styles.root}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.upgradeTitle}</Text>
        <Text style={[styles.body, {color: colors.textSecondary}]}>{texts.upgradeBody}</Text>
        {latest ? <Text style={[styles.latest, {color: colors.accent}]}>Version : {latest}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {flex: 1},
  root: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32},
  title: {fontSize: fontSize.pageHeader, fontWeight: '700', marginBottom: 16},
  body: {fontSize: fontSize.listSubtitle, textAlign: 'center'},
  // marginTop 12 — espacement sous le corps (Auth.css / Upgrade)
  latest: {marginTop: 12},
});
