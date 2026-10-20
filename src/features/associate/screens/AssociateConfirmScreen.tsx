import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {AuthFab} from '../../../shared/components/AuthFab';
import {useAssociateStore} from '../../bots/store/associateStore';
import {texts} from '../../dashboard/texts';

type Props = {onNext: () => void; onBack: () => void};

export function AssociateConfirmScreen({onNext, onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const confirm = useAssociateStore(s => s.confirm);
  const preview = useAssociateStore(s => s.preview);

  const run = async () => {
    const bot = await confirm(preview?.replace_required);
    if (bot) onNext();
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <AuthHeader title={texts.associate} onBack={onBack} />
      <View style={styles.body}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>{texts.confirm}</Text>
        {preview?.replace_required ? (
          <Text style={{color: colors.danger}}>Un webhook existant sera remplacé.</Text>
        ) : null}
        <AuthFab onPress={run} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  body: {flex: 1, padding: space.md},
  title: {fontSize: fontSize.pageHeader, fontWeight: '600', marginBottom: 12},
});
