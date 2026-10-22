/** Menu — site MenuSection.tsx + BotProfile.css */
import React from 'react';
import {View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile, MenuButton} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';

const OPTIONS: {type: MenuButton['type']; label: string; hint: string}[] = [
  {
    type: 'default',
    label: texts.menuDefault,
    hint: 'Telegram affiche le menu des commandes si le bot en a.',
  },
  {
    type: 'commands',
    label: texts.menuCommands,
    hint: 'Le bouton ouvre la liste des commandes du bot.',
  },
  {
    type: 'web_app',
    label: texts.menuWebApp,
    hint: 'Le bouton ouvre une application web (lien https).',
  },
];

type Props = {
  draft: BotProfile;
  errors: Record<string, string>;
  onChange: (button: MenuButton) => void;
};

export function MenuSection({draft, errors, onChange}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const menu = draft.menu_button;

  const choose = (type: MenuButton['type']) => {
    if (type === menu.type) return;
    if (type === 'web_app') onChange({type: 'web_app', text: 'Ouvrir', url: ''});
    else onChange({type});
  };

  return (
    <View style={styles.root}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>
        {texts.menuTitle}
      </Text>
      <Text style={[styles.note, {color: colors.textSecondary}]}>
        Ce réglage s'applique à tous les chats privés du bot.
      </Text>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, borderColor: colors.border},
        ]}>
        {OPTIONS.map((option, i) => {
          const on = menu.type === option.type;
          return (
            <View key={option.type}>
              {i > 0 ? (
                <View style={[styles.div, {backgroundColor: colors.border}]} />
              ) : null}
              <Pressable onPress={() => choose(option.type)} style={styles.row}>
                <View
                  style={[
                    styles.dot,
                    {
                      borderColor: on ? colors.accent : colors.border,
                      backgroundColor: on ? colors.accent : 'transparent',
                    },
                  ]}
                />
                <View style={styles.info}>
                  <Text style={[styles.val, {color: colors.textPrimary}]}>
                    {option.label}
                  </Text>
                  <Text style={[styles.key, {color: colors.textHint}]}>
                    {option.hint}
                  </Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {menu.type === 'web_app' ? (
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.bgPrimary,
              borderColor: colors.border,
              marginTop: m.fieldMarginTop,
              gap: 12,
              padding: 14,
            },
          ]}>
          <Text style={[styles.fieldLabel, {color: colors.textHint}]}>
            {texts.menuText}
          </Text>
          <TextInput
            value={menu.text}
            onChangeText={t => onChange({...menu, text: t})}
            placeholderTextColor={colors.textHint}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: errors['menu:text'] ? colors.danger : colors.border,
                backgroundColor: colors.bgSecondary,
              },
            ]}
          />
          {errors['menu:text'] ? (
            <Text style={{color: colors.danger, fontSize: 12}}>
              {errors['menu:text']}
            </Text>
          ) : null}
          <Text style={[styles.fieldLabel, {color: colors.textHint}]}>
            {texts.menuUrl}
          </Text>
          <TextInput
            value={menu.url}
            onChangeText={t => onChange({...menu, url: t})}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://"
            placeholderTextColor={colors.textHint}
            style={[
              styles.input,
              {
                color: colors.textPrimary,
                borderColor: errors['menu:url'] ? colors.danger : colors.border,
                backgroundColor: colors.bgSecondary,
              },
            ]}
          />
          {errors['menu:url'] ? (
            <Text style={{color: colors.danger, fontSize: 12}}>
              {errors['menu:url']}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {paddingBottom: 6},
  title: {
    fontSize: m.titleFontSize,
    fontWeight: m.titleFontWeight,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  note: {fontSize: 13, paddingHorizontal: 16, marginBottom: 12, lineHeight: 18},
  card: {marginHorizontal: 14, borderRadius: 16, borderWidth: 1, overflow: 'hidden'},
  div: {height: StyleSheet.hairlineWidth, marginLeft: 48},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: m.optionPaddingV,
    paddingHorizontal: m.optionPaddingH,
  },
  dot: {width: 20, height: 20, borderRadius: 10, borderWidth: 2},
  info: {flex: 1, gap: 2},
  val: {fontSize: 15, fontWeight: '600'},
  key: {fontSize: 12, lineHeight: 16},
  fieldLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.07,
    textTransform: 'uppercase',
  },
  input: {
    minHeight: m.inputHeight,
    borderWidth: 1,
    borderRadius: m.inputRadius,
    paddingHorizontal: 12,
    fontSize: 15,
  },
});
