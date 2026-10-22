/**
 * Onglet Langues — ajout / suppression.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {addLanguage, removeLanguage} from '../utils/edit';
import {LANGUAGE_OPTIONS, langLabel} from '../utils/languages';
import {texts} from '../texts';

type Props = {
  draft: BotProfile;
  onEdit: (recipe: (d: BotProfile) => BotProfile) => void;
};

export function LanguagesSection({draft, onEdit}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const present = new Set(Object.keys(draft.texts));
  const available = LANGUAGE_OPTIONS.filter(
    o => o.code !== DEFAULT_LANG && !present.has(o.code),
  );

  return (
    <View style={styles.stack}>
      {Object.keys(draft.texts).map(code => (
        <View
          key={code}
          style={[styles.row, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.label, {color: colors.textPrimary}]}>
            {langLabel(code)}
          </Text>
          {code !== DEFAULT_LANG ? (
            <Pressable onPress={() => onEdit(d => removeLanguage(d, code))}>
              <Text style={[styles.remove, {color: colors.danger}]}>
                {texts.removeLanguage}
              </Text>
            </Pressable>
          ) : null}
        </View>
      ))}
      {available.length > 0 ? (
        <View style={styles.addBlock}>
          <Text style={[styles.addTitle, {color: colors.textSecondary}]}>
            {texts.addLanguage}
          </Text>
          {available.slice(0, 8).map(o => (
            <Pressable
              key={o.code}
              onPress={() => onEdit(d => addLanguage(d, o.code))}
              style={[styles.addRow, {borderColor: colors.borderSoft}]}>
              <Text style={[styles.addLabel, {color: colors.accent}]}>
                + {o.label}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: 8},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: m.inputRadius,
  },
  label: {fontSize: 15, fontWeight: '600'},
  addBlock: {marginTop: 8, gap: 6},
  addTitle: {fontSize: 13, fontWeight: '600'},
  addRow: {
    padding: 12,
    borderRadius: m.inputRadius,
    borderWidth: 1,
  },
  remove: {fontWeight: '600'},
  addLabel: {fontWeight: '600'},
});
