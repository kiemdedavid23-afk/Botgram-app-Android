import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {texts} from '../texts';

export function AccountDisabledScreen(): React.JSX.Element {
  return (
    <View style={styles.outer}>
      <StatusBarStrip forceBlue />
      <View style={styles.root}>
        <Text style={styles.title}>{texts.accountDisabledTitle}</Text>
        <Text style={styles.body}>{texts.accountDisabled}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {flex: 1, backgroundColor: authColors.bg},
  root: {flex: 1, backgroundColor: authColors.bg, justifyContent: 'center', alignItems: 'center', padding: authMetrics.bodyPaddingH},
  title: {fontSize: authMetrics.titleSize, fontWeight: authMetrics.titleWeight, color: authColors.text, marginBottom: 12},
  body: {fontSize: authMetrics.subtitleSize, color: authColors.textMuted, textAlign: 'center'},
});
