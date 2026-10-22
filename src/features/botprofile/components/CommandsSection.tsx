/** Commandes — site CommandsSection + .bp-cmds */
import React, {useMemo, useState} from 'react';
import {
  View, Text, TextInput, Pressable, StyleSheet, ScrollView,
} from 'react-native';
import {Plus, Trash2, ArrowUp, ArrowDown} from 'lucide-react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {
  BotCommandItem, BotProfile, CommandScope,
} from '../../../core/api/endpoints/botProfile.types';
import {COMMAND_SCOPES, DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {cmdKey} from '../utils/edit';
import {SCOPE_LABELS} from '../utils/labels';
import {languagesOf, langLabel} from '../utils/languages';
import {texts} from '../texts';

const MAX = 100;

type Props = {
  draft: BotProfile;
  lang: string;
  onLang: (code: string) => void;
  errors: Record<string, string>;
  onChange: (key: string, list: BotCommandItem[]) => void;
};

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {paddingBottom: 6},
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
      borderRadius: m.chipRadius, borderWidth: 1, borderColor: c.border,
    },
    chipOn: {backgroundColor: c.accent},
    chipOff: {backgroundColor: c.bgPrimary},
    chipLangOn: {backgroundColor: c.accentSoft, borderColor: c.accent},
    chipLangOff: {backgroundColor: c.bgPrimary, borderColor: c.border},
    chipTextOn: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight, color: c.white},
    chipTextOff: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight, color: c.textSecondary},
    chipTextLangOn: {fontSize: m.chipFontSize, fontWeight: m.chipFontWeight, color: c.accent},
    actions: {
      flexDirection: 'row', flexWrap: 'wrap', gap: m.actionsGap,
      paddingHorizontal: m.actionsPaddingH, paddingVertical: m.actionsPaddingV,
    },
    btn: {
      flexDirection: 'row', alignItems: 'center', gap: m.btnGap,
      paddingVertical: m.btnPadV, paddingHorizontal: m.btnPadH, borderRadius: m.btnRadius,
    },
    btnAccent: {backgroundColor: c.accentSoft},
    btnMuted: {backgroundColor: c.bgSecondary},
    btnTextAccent: {fontWeight: m.chipFontWeight, color: c.accent},
    btnTextMuted: {fontWeight: m.chipFontWeight, color: c.textSecondary},
    empty: {padding: m.emptyPad, color: c.textHint},
    item: {
      flexDirection: 'row', gap: m.itemGap, alignItems: 'flex-start',
      paddingVertical: m.itemPaddingV, paddingHorizontal: m.itemPaddingH,
      borderTopWidth: 1, borderTopColor: c.bgSecondary,
    },
    fields: {flex: 1, gap: m.fieldGapInner},
    line: {flexDirection: 'row', alignItems: 'center', gap: m.lineGap},
    slash: {fontSize: m.slashFontSize, fontWeight: m.slashFontWeight, color: c.accent},
    input: {
      flex: 1, minHeight: m.inputHeight, borderWidth: 1, borderRadius: m.inputRadius,
      paddingHorizontal: m.inputPadH, fontSize: m.inputFontSize,
      color: c.textPrimary, backgroundColor: c.bgPrimary, borderColor: c.border,
    },
    inputErr: {borderColor: c.danger},
    tools: {gap: m.fieldGapInner, paddingTop: m.toolPadTop},
    err: {fontSize: m.errFontSize, color: c.danger},
    listErr: {padding: m.listErrPad, color: c.danger},
  });
}

export function CommandsSection({
  draft, lang, onLang, errors, onChange,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [scope, setScope] = useState<CommandScope>('default');
  const key = cmdKey(scope, lang);
  const list = draft.commands[key] ?? [];
  const defaultList = draft.commands[cmdKey('default', DEFAULT_LANG)] ?? [];
  const canReuse =
    list.length === 0 && key !== cmdKey('default', DEFAULT_LANG) && defaultList.length > 0;
  const langs = languagesOf(draft.texts);

  const update = (index: number, patch: Partial<BotCommandItem>) => {
    onChange(key, list.map((item, i) => (i === index ? {...item, ...patch} : item)));
  };
  const move = (index: number, delta: number) => {
    const target = index + delta;
    if (target < 0 || target >= list.length) return;
    const next = [...list];
    const tmp = next[index]!;
    next[index] = next[target]!;
    next[target] = tmp;
    onChange(key, next);
  };
  const add = () => {
    if (list.length >= MAX) return;
    onChange(key, [...list, {command: '', description: ''}]);
  };
  const remove = (index: number) => {
    onChange(key, list.filter((_, i) => i !== index));
  };

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
      <Text style={styles.label}>Langue</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {langs.map(code => {
            const on = code === lang;
            return (
              <Pressable
                key={code}
                onPress={() => onLang(code)}
                style={[styles.chip, on ? styles.chipLangOn : styles.chipLangOff]}>
                <Text style={on ? styles.chipTextLangOn : styles.chipTextOff}>
                  {langLabel(code)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable onPress={add} style={[styles.btn, styles.btnAccent]}>
          <Plus size={m.toolIconSize - 2} color={colors.accent} />
          <Text style={styles.btnTextAccent}>{texts.cmdsAdd}</Text>
        </Pressable>
        {canReuse ? (
          <Pressable
            onPress={() => onChange(key, defaultList.map(c => ({...c})))}
            style={[styles.btn, styles.btnMuted]}>
            <Text style={styles.btnTextMuted}>{texts.cmdsReuseDefault}</Text>
          </Pressable>
        ) : null}
      </View>
      {list.length === 0 ? <Text style={styles.empty}>{texts.cmdsEmpty}</Text> : null}
      {list.map((item, index) => {
        const errCmd = errors[`cmd:${key}:${index}:command`];
        const errDesc = errors[`cmd:${key}:${index}:description`];
        return (
          <View key={`${key}-${index}`} style={styles.item}>
            <View style={styles.fields}>
              <View style={styles.line}>
                <Text style={styles.slash}>/</Text>
                <TextInput
                  value={item.command}
                  onChangeText={t =>
                    update(index, {command: t.toLowerCase().replace(/[^a-z0-9_]/g, '')})
                  }
                  placeholder="commande"
                  placeholderTextColor={colors.textHint}
                  autoCapitalize="none"
                  style={[styles.input, errCmd ? styles.inputErr : null]}
                />
              </View>
              {errCmd ? <Text style={styles.err}>{errCmd}</Text> : null}
              <TextInput
                value={item.description}
                onChangeText={t => update(index, {description: t})}
                placeholder="Description"
                placeholderTextColor={colors.textHint}
                style={[styles.input, errDesc ? styles.inputErr : null]}
              />
              {errDesc ? <Text style={styles.err}>{errDesc}</Text> : null}
            </View>
            <View style={styles.tools}>
              <Pressable onPress={() => move(index, -1)} hitSlop={8}>
                <ArrowUp size={m.toolIconSize} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={8}>
                <ArrowDown size={m.toolIconSize} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => remove(index)} hitSlop={8}>
                <Trash2 size={m.toolIconSize} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        );
      })}
      {errors[`cmd:${key}:list`] ? (
        <Text style={styles.listErr}>{errors[`cmd:${key}:list`]}</Text>
      ) : null}
    </View>
  );
}
