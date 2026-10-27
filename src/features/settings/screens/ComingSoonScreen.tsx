import React from 'react';
import {View, StyleSheet} from 'react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {EmptyScreen} from '../../../shared/components/EmptyScreen';
import {settingsTexts as t} from '../texts';

type Props = {
  title: string;
  onBack: () => void;
};

export function ComingSoonScreen({title, onBack}: Props): React.JSX.Element {
  return (
    <SettingsShell title={title} onBack={onBack}>
      <View style={styles.body}>
        <EmptyScreen title={t.comingSoon} subtitle={t.comingSoonSub} />
      </View>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  body: {flex: 1},
});
