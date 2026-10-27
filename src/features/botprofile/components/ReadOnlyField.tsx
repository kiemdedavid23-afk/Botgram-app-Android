/**
 * Champ en lecture seule : libellé, valeur en texte, aide optionnelle.
 * Volontairement sans cadre de saisie ni compteur (aucune illusion d'édition).
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {texts} from '../texts';

type Props = {
  label: string;
  value: string;
  hint?: string;
};

export function ReadOnlyField({label, value, hint}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const empty = value.trim().length === 0;
  return (
    <View style={styles.field}>
      <Text style={[styles.label, {color: colors.textSecondary}]}>{label}</Text>
      <Text
        selectable
        style={[
          styles.value,
          {color: empty ? colors.textHint : colors.textPrimary},
        ]}>
        {empty ? texts.emptyValue : value}
      </Text>
      {hint ? (
        <Text style={[styles.hint, {color: colors.textHint}]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: {gap: m.fieldInnerGap},
  label: {fontSize: m.labelSize, fontWeight: m.labelWeight},
  value: {fontSize: m.inputFontSize},
  hint: {fontSize: m.errFontSize},
});