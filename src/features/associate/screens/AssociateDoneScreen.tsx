import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {AuthFab} from '../../../shared/components/AuthFab';
import {texts} from '../texts';

type Props = {onDone: () => void};

export function AssociateDoneScreen({onDone}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <AuthHeader title={texts.associate} />
      <View style={styles.body}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.done}</Text>
        <Text style={{color: colors.textSecondary}}>Votre bot est maintenant associé.</Text>
        <AuthFab onPress={onDone} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1, padding: space.md},
  title: {fontSize: fontSize.pageHeader, fontWeight: '600', marginBottom: 12},
});
