/**
 * Champ de formulaire profil — .mp-field
 */
import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useTheme, memberProfileMetrics as m} from '../../../shared/theme';

type Props = {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  error?: string;
  keyboardType?: 'default' | 'phone-pad';
  autoCapitalize?: 'none' | 'characters';
};

export function ProfileField({
  label,
  value,
  onChange,
  placeholder,
  error,
  keyboardType,
  autoCapitalize,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.field}>
      <Text style={[styles.fieldLabel, {color: colors.textSecondary}]}>
        {label}
      </Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize ?? 'none'}
        style={[
          styles.input,
          {
            borderColor: error ? colors.danger : colors.border,
            backgroundColor: colors.bgSecondary,
            color: colors.textPrimary,
          },
        ]}
      />
      {error ? (
        <Text style={[styles.err, {color: colors.danger}]}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {gap: m.fieldGap},
  fieldLabel: {fontSize: m.fieldLabelSize, fontWeight: '600'},
  input: {
    height: m.fieldInputHeight,
    paddingHorizontal: m.fieldInputPadH,
    borderRadius: m.fieldInputRadius,
    borderWidth: m.fieldInputBorder,
    fontSize: m.fieldInputFont,
  },
  err: {fontSize: 13},
});
