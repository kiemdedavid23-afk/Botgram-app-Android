/** Commandes — site CommandsSection + .bp-cmds */
import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from 'react-native';
import {Plus, Trash2, ArrowUp, ArrowDown} from 'lucide-react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {
  BotCommandItem,
  BotProfile,
  CommandScope,
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
export function CommandsSection({
  draft,
  lang,
  onLang,
  errors,
  onChange,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [scope, setScope] = useState<CommandScope>('default');
  const key = cmdKey(scope, lang);
  const list = draft.commands[key] ?? [];
  const defaultList = draft.commands[cmdKey('default', DEFAULT_LANG)] ?? [];
  const canReuse =
    list.length === 0 &&
    key !== cmdKey('default', DEFAULT_LANG) &&
    defaultList.length > 0;
  const langs = languagesOf(draft.texts);
  const update = (index: number, patch: Partial<BotCommandItem>) => {
    onChange(
      key,
      list.map((item, i) => (i === index ? {...item, ...patch} : item)),
    );
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
    onChange(
      key,
      list.filter((_, i) => i !== index),
    );
  };
  return (
    <View style={styles.root}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>
        {texts.cmdsTitle}
      </Text>
      <Text style={[styles.label, {color: colors.textHint}]}>
        {texts.cmdsScope}
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {COMMAND_SCOPES.map(s => {
            const on = s === scope;
            return (
              <Pressable
                key={s}
                onPress={() => setScope(s)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.accent : colors.bgPrimary,
                    borderColor: colors.border,
                  },
                ]}>
                <Text
                  style={{
                    color: on ? '#fff' : colors.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {SCOPE_LABELS[s]}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <Text style={[styles.label, {color: colors.textHint}]}>Langue</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={styles.row}>
          {langs.map(code => {
            const on = code === lang;
            return (
              <Pressable
                key={code}
                onPress={() => onLang(code)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: on ? colors.accentSoft : colors.bgPrimary,
                    borderColor: on ? colors.accent : colors.border,
                  },
                ]}>
                <Text
                  style={{
                    color: on ? colors.accent : colors.textSecondary,
                    fontSize: 13,
                    fontWeight: '600',
                  }}>
                  {langLabel(code)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
      <View style={styles.actions}>
        <Pressable
          onPress={add}
          style={[styles.btn, {backgroundColor: colors.accentSoft}]}>
          <Plus size={16} color={colors.accent} />
          <Text style={{color: colors.accent, fontWeight: '600'}}>
            {texts.cmdsAdd}
          </Text>
        </Pressable>
        {canReuse ? (
          <Pressable
            onPress={() => onChange(key, defaultList.map(c => ({...c})))}
            style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
            <Text style={{color: colors.textSecondary, fontWeight: '600'}}>
              {texts.cmdsReuseDefault}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {list.length === 0 ? (
        <Text style={{color: colors.textHint, padding: 16}}>
          {texts.cmdsEmpty}
        </Text>
      ) : null}
      {list.map((item, index) => {
        const errCmd = errors[`cmd:${key}:${index}:command`];
        const errDesc = errors[`cmd:${key}:${index}:description`];
        return (
          <View
            key={`${key}-${index}`}
            style={[styles.item, {borderTopColor: colors.bgSecondary}]}>
            <View style={styles.fields}>
              <View style={styles.line}>
                <Text style={[styles.slash, {color: colors.accent}]}>/</Text>
                <TextInput
                  value={item.command}
                  onChangeText={t =>
                    update(index, {
                      command: t.toLowerCase().replace(/[^a-z0-9_]/g, ''),
                    })
                  }
                  placeholder="commande"
                  placeholderTextColor={colors.textHint}
                  autoCapitalize="none"
                  style={[
                    styles.input,
                    {
                      color: colors.textPrimary,
                      borderColor: errCmd ? colors.danger : colors.border,
                      backgroundColor: colors.bgPrimary,
                    },
                  ]}
                />
              </View>
              {errCmd ? (
                <Text style={{color: colors.danger, fontSize: 12}}>{errCmd}</Text>
              ) : null}
              <TextInput
                value={item.description}
                onChangeText={t => update(index, {description: t})}
                placeholder="Description"
                placeholderTextColor={colors.textHint}
                style={[
                  styles.input,
                  {
                    color: colors.textPrimary,
                    borderColor: errDesc ? colors.danger : colors.border,
                    backgroundColor: colors.bgPrimary,
                  },
                ]}
              />
              {errDesc ? (
                <Text style={{color: colors.danger, fontSize: 12}}>{errDesc}</Text>
              ) : null}
            </View>
            <View style={styles.tools}>
              <Pressable onPress={() => move(index, -1)} hitSlop={8}>
                <ArrowUp size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => move(index, 1)} hitSlop={8}>
                <ArrowDown size={18} color={colors.textSecondary} />
              </Pressable>
              <Pressable onPress={() => remove(index)} hitSlop={8}>
                <Trash2 size={18} color={colors.danger} />
              </Pressable>
            </View>
          </View>
        );
      })}
      {errors[`cmd:${key}:list`] ? (
        <Text style={{color: colors.danger, padding: 12}}>
          {errors[`cmd:${key}:list`]}
        </Text>
      ) : null}
    </View>
  );
}
const styles = StyleSheet.create({
  root: {paddingBottom: 6},
  title: {
    fontSize: m.titleFontSize,
    fontWeight: m.titleFontWeight,
    paddingHorizontal: m.headPaddingH,
    paddingTop: m.headPaddingTop,
    paddingBottom: m.headPaddingBottom,
  },
  label: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.07,
    textTransform: 'uppercase',
    paddingHorizontal: 16,
    marginBottom: 6,
    marginTop: 8,
  },
  row: {flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 8},
  chip: {
    paddingVertical: m.chipPadV,
    paddingHorizontal: m.chipPadH,
    borderRadius: m.chipRadius,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: m.actionsGap,
    paddingHorizontal: m.actionsPaddingH,
    paddingVertical: m.actionsPaddingV,
  },
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  item: {
    flexDirection: 'row',
    gap: m.itemGap,
    alignItems: 'flex-start',
    paddingVertical: m.itemPaddingV,
    paddingHorizontal: m.itemPaddingH,
    borderTopWidth: 1,
  },
  fields: {flex: 1, gap: 8},
  line: {flexDirection: 'row', alignItems: 'center', gap: 6},
  slash: {fontSize: m.slashFontSize, fontWeight: m.slashFontWeight},
  input: {
    flex: 1,
    minHeight: m.inputHeight,
    borderWidth: 1,
    borderRadius: m.inputRadius,
    paddingHorizontal: 12,
    fontSize: 15,
  },
  tools: {gap: 6, paddingTop: 4},
});
