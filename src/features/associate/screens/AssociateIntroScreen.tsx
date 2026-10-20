import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {AuthFab} from '../../../shared/components/AuthFab';
import {texts} from '../../dashboard/texts';

type Props = {onNext: () => void; onBack: () => void};

export function AssociateIntroScreen({onNext, onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <AuthHeader title={texts.associate} onBack={onBack} />
      <View style={styles.body}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>Associer un bot</Text>
        <Text style={[styles.help, {color: colors.textSecondary}]}>
          Connectez un bot Telegram existant à Botgram. Vous aurez besoin du jeton fourni par @BotFather.
        </Text>
        <AuthFab onPress={onNext} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1, padding: space.md},
  title: {fontSize: fontSize.pageHeader, fontWeight: '600', marginBottom: 12},
  help: {fontSize: fontSize.listSubtitle, lineHeight: 22},
});
