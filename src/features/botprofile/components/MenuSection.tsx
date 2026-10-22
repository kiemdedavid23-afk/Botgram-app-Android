/** Menu — site MenuSection + BotProfile.css */
import React, {useMemo} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {BotProfile, MenuButton} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';

const OPTIONS: {type: MenuButton['type']; label: string; hint: string}[] = [
  {type: 'default', label: texts.menuDefault, hint: 'Telegram affiche le menu des commandes si le bot en a.'},
  {type: 'commands', label: texts.menuCommands, hint: 'Le bouton ouvre la liste des commandes du bot.'},
  {type: 'web_app', label: texts.menuWebApp, hint: 'Le bouton ouvre une application web (lien https).'},
];

type Props = {
  draft: BotProfile;
  errors: Record<string, string>;
  onChange: (button: MenuButton) => void;
};

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {paddingBottom: m.rootPadBottom},
    title: {
      fontSize: m.titleFontSize, fontWeight: m.titleFontWeight,
      paddingHorizontal: m.headPaddingH, paddingTop: m.headPaddingTop,
      paddingBottom: m.titlePadBottom, color: c.textPrimary,
    },
    note: {
      fontSize: m.noteSize, paddingHorizontal: m.headPaddingH,
      marginBottom: m.noteMarginBottom, lineHeight: m.noteLineHeight,
      color: c.textSecondary,
    },
    card: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius,
      borderWidth: m.borderWidth, borderColor: c.border, backgroundColor: c.bgPrimary, overflow: 'hidden',
    },
    fields: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius, borderWidth: m.borderWidth,
      borderColor: c.border, backgroundColor: c.bgPrimary, marginTop: m.fieldMarginTop,
      gap: m.fieldsGap, padding: m.fieldsPad,
    },
    div: {height: StyleSheet.hairlineWidth, marginLeft: m.radioMarginLeft, backgroundColor: c.border},
    row: {
      flexDirection: 'row', alignItems: 'center', gap: m.rowGap,
      paddingVertical: m.optionPaddingV, paddingHorizontal: m.optionPaddingH,
    },
    dot: {
      width: m.radioDotSize, height: m.radioDotSize, borderRadius: m.radioDotSize / 2,
      borderWidth: m.radioDotBorder, borderColor: c.border, backgroundColor: 'transparent',
    },
    dotOn: {borderColor: c.accent, backgroundColor: c.accent},
    info: {flex: 1, gap: m.infoInnerGap},
    val: {fontSize: m.valSize, fontWeight: m.valWeight, color: c.textPrimary},
    key: {fontSize: m.keySize, lineHeight: m.keyLineHeight, color: c.textHint},
    fieldLabel: {
      fontSize: m.sectionLabelSize, fontWeight: m.sectionLabelWeight,
      letterSpacing: m.sectionLabelSpacing, textTransform: 'uppercase', color: c.textHint,
    },
    input: {
      minHeight: m.inputHeight, borderWidth: m.borderWidth, borderRadius: m.inputRadius,
      paddingHorizontal: m.inputPadH, fontSize: m.inputFontSize,
      color: c.textPrimary, backgroundColor: c.bgSecondary, borderColor: c.border,
    },
    inputErr: {borderColor: c.danger},
    err: {fontSize: m.errFontSize, color: c.danger},
  });
}

export function MenuSection({draft, errors, onChange}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const menu = draft.menu_button;

  const choose = (type: MenuButton['type']) => {
    if (type === menu.type) return;
    if (type === 'web_app') onChange({type: 'web_app', text: 'Ouvrir', url: ''});
    else onChange({type});
  };

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{texts.menuTitle}</Text>
      <Text style={styles.note}>Ce réglage s'applique à tous les chats privés du bot.</Text>
      <View style={styles.card}>
        {OPTIONS.map((option, i) => {
          const on = menu.type === option.type;
          return (
            <View key={option.type}>
              {i > 0 ? <View style={styles.div} /> : null}
              <Pressable onPress={() => choose(option.type)} style={styles.row}>
                <View style={[styles.dot, on ? styles.dotOn : null]} />
                <View style={styles.info}>
                  <Text style={styles.val}>{option.label}</Text>
                  <Text style={styles.key}>{option.hint}</Text>
                </View>
              </Pressable>
            </View>
          );
        })}
      </View>
      {menu.type === 'web_app' ? (
        <View style={styles.fields}>
          <Text style={styles.fieldLabel}>{texts.menuText}</Text>
          <TextInput
            value={menu.text}
            onChangeText={t => onChange({...menu, text: t})}
            placeholderTextColor={colors.textHint}
            style={[styles.input, errors['menu:text'] ? styles.inputErr : null]}
          />
          {errors['menu:text'] ? <Text style={styles.err}>{errors['menu:text']}</Text> : null}
          <Text style={styles.fieldLabel}>{texts.menuUrl}</Text>
          <TextInput
            value={menu.url}
            onChangeText={t => onChange({...menu, url: t})}
            autoCapitalize="none"
            keyboardType="url"
            placeholder="https://"
            placeholderTextColor={colors.textHint}
            style={[styles.input, errors['menu:url'] ? styles.inputErr : null]}
          />
          {errors['menu:url'] ? <Text style={styles.err}>{errors['menu:url']}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
