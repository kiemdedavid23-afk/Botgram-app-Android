import React, {useState} from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {AuthHeader} from '../../auth/components/AuthHeader';
import {AuthFab} from '../../../shared/components/AuthFab';
import {useAssociateStore} from '../../bots';
import {texts} from '../texts';

type Props = {onNext: () => void; onBack: () => void};

export function AssociateTokenScreen({
  onNext,
  onBack,
}: Props): React.JSX.Element {
  const setToken = useAssociateStore(s => s.setToken);
  const [value, setValue] = useState('');
  const [hidden] = useState(true);

  return (
    <View style={styles.root}>
      <AuthHeader title={texts.associate} onBack={onBack} />
      <View style={styles.body}>
        <Text style={styles.help}>{texts.tokenPlaceholder}</Text>
        <TextInput
          style={styles.field}
          value={value}
          onChangeText={t => {
            setValue(t);
            setToken(t);
          }}
          placeholder={texts.tokenPlaceholder}
          placeholderTextColor={authColors.textMuted}
          secureTextEntry={hidden}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <AuthFab onPress={onNext} disabled={!value} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg},
  body: {
    flex: 1,
    paddingHorizontal: authMetrics.bodyPaddingH,
    paddingTop: 16,
  },
  help: {color: authColors.textMuted, marginBottom: 16},
  field: {
    borderBottomWidth: 1,
    borderBottomColor: authColors.border,
    paddingVertical: authMetrics.fieldPaddingV,
    fontSize: authMetrics.fieldFontSize,
    color: authColors.text,
  },
});
