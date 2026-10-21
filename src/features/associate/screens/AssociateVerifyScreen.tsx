import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, space, fontSize} from '../../../shared/theme';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {AuthFab} from '../../../shared/components/AuthFab';
import {
  useAssociateStore,
  type VerifyResult,
} from '../../bots/store/associateStore';
import {texts} from '../texts';

type Props = {onNext: () => void; onBack: () => void};

const ADVANCE: ReadonlySet<VerifyResult> = new Set([
  'ok',
  'replace_required',
]);

export function AssociateVerifyScreen({
  onNext,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const preview = useAssociateStore(s => s.preview);
  const verify = useAssociateStore(s => s.verify);

  const run = async () => {
    const result: VerifyResult = await verify();
    if (ADVANCE.has(result)) {
      onNext();
    }
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <AuthHeader title={texts.associate} onBack={onBack} />
      <View style={styles.body}>
        <Text style={[styles.title, {color: colors.textPrimary}]}>
          {texts.verify}
        </Text>
        {preview ? (
          <Text style={{color: colors.textPrimary}}>
            {preview.name} (@{preview.username})
          </Text>
        ) : (
          <Text style={{color: colors.textSecondary}}>
            Vérification en cours…
          </Text>
        )}
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
