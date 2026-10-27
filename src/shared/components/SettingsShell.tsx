/**
 * Sous-page avec en-tête (flèche retour, titre centré, bandeau de barre d'état).
 * L'en-tête est dans ScreenHeader (commun avec le parcours d'association).
 */
import React, {type ReactNode} from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../theme';
import {ScreenHeader} from './ScreenHeader';

type Props = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

export function SettingsShell({title, onBack, children}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScreenHeader title={title} onBack={onBack} />
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1},
});
