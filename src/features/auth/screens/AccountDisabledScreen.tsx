import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';

export function AccountDisabledScreen(): React.JSX.Element {
  return (
    <View style={styles.root}>
      <Text style={styles.title}>{texts.accountDisabledTitle}</Text>
      <Text style={styles.body}>{texts.accountDisabled}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg, justifyContent: 'center', alignItems: 'center', padding: authMetrics.bodyPaddingH},
  title: {fontSize: authMetrics.titleSize, fontWeight: authMetrics.titleWeight, color: authColors.text, marginBottom: 12},
  body: {fontSize: authMetrics.subtitleSize, color: authColors.textMuted, textAlign: 'center'},
});
