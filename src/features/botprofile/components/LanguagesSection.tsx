/**
 * Onglet Langues (lecture seule) — langues présentes dans le profil.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {langLabel} from '../utils/languages';

type Props = {
  profile: BotProfile;
};

export function LanguagesSection({profile}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.stack}>
      {Object.keys(profile.texts).map(code => (
        <View
          key={code}
          style={[styles.row, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.label, {color: colors.textPrimary}]}>
            {langLabel(code)}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: m.langStackGap},
  row: {padding: m.langRowPad, borderRadius: m.inputRadius},
  label: {fontSize: m.langNameSize, fontWeight: m.langNameWeight},
});
