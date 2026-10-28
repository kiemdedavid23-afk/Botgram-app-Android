import React from 'react';
import {View, StyleSheet} from 'react-native';
import {EmptyScreen} from '../../../shared/components/EmptyScreen';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';

type Props = {
  title: string;
  onBack: () => void;
};

export function ComingSoonScreen({title, onBack}: Props): React.JSX.Element {
  return (
    <SettingsPage title={title} onBack={onBack}>
      <View style={styles.body}>
        <EmptyScreen title={t.comingSoon} subtitle={t.comingSoonSub} />
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  body: {flex: 1},
});
