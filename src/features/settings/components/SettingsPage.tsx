/**
 * Page Paramètres : en-tête unique + fond gris. Le contenu gère son défilement.
 */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {SettingsHeader} from './SettingsHeader';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsPage({title, onBack, right, children}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <SettingsHeader title={title} onBack={onBack} right={right} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1}});
