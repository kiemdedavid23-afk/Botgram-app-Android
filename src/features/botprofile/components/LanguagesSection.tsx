/**
 * Onglet Langues (lecture seule) — nom de la langue à gauche, code à droite.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {languagesOf, langLabel} from '../utils/languages';

type Props = {
  profile: BotProfile;
};

export function LanguagesSection({profile}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.stack}>
      {languagesOf(profile.texts).map(code => (
        <View
          key={code}
          style={[styles.row, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.label, {color: colors.textPrimary}]}>
            {langLabel(code)}
          </Text>
          {code === DEFAULT_LANG ? null : (
            <Text style={[styles.code, {color: colors.textHint}]}>
              {code.toUpperCase()}
            </Text>
          )}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: m.langStackGap},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: m.langRowPad,
    borderRadius: m.inputRadius,
  },
  label: {fontSize: m.langNameSize, fontWeight: m.langNameWeight},
  code: {fontSize: m.langSubSize, fontWeight: m.labelWeight},
});
