/** Commandes (lecture seule) — site CommandsSection + .bp-cmds */
import React, {useMemo, useState} from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {BotProfile, CommandScope} from '../../../core/api/endpoints/botProfile.types';
import {COMMAND_SCOPES} from '../../../core/api/endpoints/botProfile.types';
import {cmdKey} from '../utils/edit';
import {SCOPE_LABELS} from '../utils/labels';
import {languagesOf, langLabel} from '../utils/languages';
import {texts} from '../texts';

type Props = {
  profile: BotProfile;
  lang: string;
  onLang: (code: string) => void;
};

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {paddingBottom: m.rootPadBottom},
    title: {
      fontSize: m.titleFontSize, fontWeight: m.titleFontWeight,
      paddingHorizontal: m.headPaddingH, paddingTop: m.headPaddingTop,
      paddingBottom: m.headPaddingBottom, color: c.textPrimary,
    },
    label: {
      fontSize: m.sectionLabelSize, fontWeight: m.sectionLabelWeight,
      letterSpacing: m.sectionLabelSpacing, textTransform: 'uppercase',
      paddingHorizontal: m.headPaddingH, marginBottom: m.labelMarginBottom,
      marginTop: m.labelMarginTop, color: c.textHint,
    },
    row: {
      flexDirection: 'row', gap: m.scopeRowGap,
      paddingHorizontal: m.headPaddingH, marginBottom: m.scopeRowMarginBottom,
    },
    chip: {
      paddingVertical: m.chipPadV, paddingHorizontal: m.chipPadH,
      borderRadius: m.chipRadius,
    },
    chipOn: {backgroundColor: c.accentSoft},
    chipOff: {backgroundColor: c.bgPrimary},
    chipTextOn: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight, color: c.accent},
    chipTextOff: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight, color: c.textSecondary},
    empty: {padding: m.emptyPad, color: c.textHint},
    card: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius,
      backgroundColor: c.bgPrimary, overflow: 'hidden',
    },
    item: {
      gap: m.fieldGapInner,
      paddingVertical: m.itemPaddingV, paddingHorizontal: m.itemPaddingH,
    },
    itemSep: {borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border},
    cmd: {fontSize: m.slashFontSize, fontWeight: m.slashFontWeight, color: c.accent},
    desc: {fontSize: m.inputFontSize, color: c.textPrimary},
  });
}

export function CommandsSection({profile, lang, onLang}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [scope, setScope] = useState<CommandScope>('default');
  const list = profile.commands[cmdKey(scope, lang)] ?? [];
  const langs = languagesOf(profile.texts);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{texts.cmdsTitle}</Text>
      <Text style={styles.label}>{texts.cmdsScope}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {COMMAND_SCOPES.map(s => {
            const on = s === scope;
            return (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                <Text style={on ? styles.chipTextOn : styles.chipTextOff}>
                  {SCOPE_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Text style={styles.label}>{texts.cmdsLang}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {langs.map(code => {
            const on = code === lang;
            return (
              <Pressable
                key={code}
                onPress={() => onLang(code)}
                style={[styles.chip, on ? styles.chipOn : styles.chipOff]}>
                <Text style={on ? styles.chipTextOn : styles.chipTextOff}>
                  {langLabel(code)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      {list.length === 0 ? <Text style={styles.empty}>{texts.cmdsEmpty}</Text> : null}
      {list.length > 0 ? (
        <View style={styles.card}>
          {list.map((item, index) => (
            <View
              key={`${scope}-${lang}-${index}`}
              style={[styles.item, index > 0 ? styles.itemSep : null]}>
              <Text selectable style={styles.cmd}>/{item.command}</Text>
              <Text selectable style={styles.desc}>{item.description}</Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
