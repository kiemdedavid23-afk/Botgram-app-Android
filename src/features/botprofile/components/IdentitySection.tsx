/**
 * Onglet Identité — name / description / short par langue.
 */
import React from 'react';
import {View, Text, TextInput, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {setTextField} from '../utils/edit';
import {validate} from '../utils/validate';
import {FIELD_LIMITS} from '../utils/labels';
import {texts} from '../texts';
import {LangChips} from './LangChips';

type Props = {
  draft: BotProfile;
  lang: string;
  onLang: (lang: string) => void;
  onEdit: (recipe: (d: BotProfile) => BotProfile) => void;
};

export function IdentitySection({
  draft,
  lang,
  onLang,
  onEdit,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const t = draft.texts[lang] ?? draft.texts[DEFAULT_LANG] ?? {
    name: '',
    description: '',
    short_description: '',
  };

  const errors = validate(draft);
  const field = (
    label: string,
    key: 'name' | 'description' | 'short_description',
    multiline?: boolean,
  ) => {
    const err = errors[`text:${lang}:${key}`];
    const limit = FIELD_LIMITS[key];
    return (
      <View style={styles.field}>
        <View style={styles.fieldHead}>
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            {label}
          </Text>
          <Text style={[styles.counter, {color: colors.textHint}]}>
            {t[key].length}/{limit}
          </Text>
        </View>
        <TextInput
          value={t[key]}
          onChangeText={v =>
            onEdit(d => setTextField(d, lang, key, v.slice(0, limit)))
          }
          multiline={multiline}
          style={[
            styles.input,
            multiline && styles.area,
            {
              color: colors.textPrimary,
              borderColor: err ? colors.danger : colors.border,
              backgroundColor: colors.bgSecondary,
            },
          ]}
        />
        {err ? (
          <Text style={[styles.err, {color: colors.danger}]}>{err}</Text>
        ) : null}
      </View>
    );
  };

  return (
    <View style={styles.stack}>
      <LangChips
        languages={Object.keys(draft.texts)}
        active={lang}
        onSelect={onLang}
      />
      {field(texts.labelName, 'name')}
      {field(texts.labelDescription, 'description', true)}
      {field(texts.labelShort, 'short_description', true)}
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: m.stackGap},
  field: {gap: m.fieldInnerGap},
  fieldHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  label: {fontSize: m.labelSize, fontWeight: m.labelWeight},
  counter: {fontSize: m.counterSize},
  input: {
    minHeight: m.inputHeight,
    borderRadius: m.inputRadius,
    borderWidth: m.borderWidth,
    paddingHorizontal: m.inputPadH,
    paddingVertical: m.inputPadV,
    fontSize: m.inputFontSize,
  },
  area: {minHeight: m.areaMinHeight, textAlignVertical: 'top'},
  err: {fontSize: m.errFontSize},
});
