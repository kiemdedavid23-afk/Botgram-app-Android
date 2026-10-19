/**
 * Écran vide de socle — titre + sous-titre centrés.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, fontSize, fontWeight, space} from '../theme';

type Props = {
  title: string;
  subtitle?: string;
};

export function EmptyScreen({title, subtitle}: Props): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
      {subtitle ? (
        <Text style={[styles.subtitle, {color: colors.textSecondary}]}>
          {subtitle}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: space.bottomNavZone,
  },
  title: {
    fontSize: fontSize.pageHeader,
    fontWeight: fontWeight.bold,
    letterSpacing: -0.02 * fontSize.pageHeader,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: fontSize.listSubtitle,
    textAlign: 'center',
  },
});
