/**
 * Onglet Identité (lecture seule) — puces de langue puis nom et descriptions.
 */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';
import {LangChips} from './LangChips';
import {ReadOnlyField} from './ReadOnlyField';

type Props = {
  profile: BotProfile;
  lang: string;
  onLang: (lang: string) => void;
};

export function IdentitySection({
  profile,
  lang,
  onLang,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const t = profile.texts[lang] ?? profile.texts[DEFAULT_LANG] ?? {
    name: '',
    description: '',
    short_description: '',
  };

  return (
    <View style={styles.stack}>
      <LangChips
        languages={Object.keys(profile.texts)}
        active={lang}
        onSelect={onLang}
      />
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <ReadOnlyField
          label={texts.labelName}
          value={t.name}
          hint={texts.hintName}
        />
        <ReadOnlyField
          label={texts.labelDescription}
          value={t.description}
          hint={texts.hintDescription}
        />
        <ReadOnlyField
          label={texts.labelShort}
          value={t.short_description}
          hint={texts.hintShort}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: m.stackGap},
  card: {
    borderRadius: m.cardRadius,
    padding: m.fieldsPad,
    gap: m.stackGap,
  },
});
