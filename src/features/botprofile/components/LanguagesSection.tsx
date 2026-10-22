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
  stack: {gap: m.langStackGap},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: m.langRowPad,
    borderRadius: m.inputRadius,
  },
  label: {fontSize: m.langNameSize, fontWeight: m.langNameWeight},
  addBlock: {marginTop: m.langAddMarginTop, gap: m.fieldInnerGap},
  addTitle: {fontSize: m.langAddTitleSize, fontWeight: m.chipFontWeight},
  addRow: {
    padding: m.langRowGap,
    borderRadius: m.inputRadius,
    borderWidth: m.borderWidth,
  },
  remove: {fontWeight: m.chipFontWeight},
  addLabel: {fontWeight: m.chipFontWeight},
});
