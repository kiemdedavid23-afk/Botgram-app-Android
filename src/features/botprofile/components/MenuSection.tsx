/** Menu (lecture seule) — réglage actuel du bouton de menu. */
import React, {useMemo} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {BotProfile, MenuButton} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';
import {ReadOnlyField} from './ReadOnlyField';

const OPTIONS: {type: MenuButton['type']; label: string; hint: string}[] = [
  {type: 'default', label: texts.menuDefault, hint: 'Telegram affiche le menu des commandes si le bot en a.'},
  {type: 'commands', label: texts.menuCommands, hint: 'Le bouton ouvre la liste des commandes du bot.'},
  {type: 'web_app', label: texts.menuWebApp, hint: 'Le bouton ouvre une application web (lien https).'},
];

type Props = {
  profile: BotProfile;
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
      backgroundColor: c.bgPrimary, padding: m.optionPaddingH, gap: m.infoInnerGap,
    },
    fields: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius,
      backgroundColor: c.bgPrimary, marginTop: m.fieldMarginTop,
      gap: m.fieldsGap, padding: m.fieldsPad,
    },
    val: {fontSize: m.valSize, fontWeight: m.valWeight, color: c.textPrimary},
    key: {fontSize: m.keySize, lineHeight: m.keyLineHeight, color: c.textHint},
  });
}

export function MenuSection({profile}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const menu = profile.menu_button;
  const current = OPTIONS.find(o => o.type === menu.type) ?? OPTIONS[0]!;

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{texts.menuTitle}</Text>
      <Text style={styles.note}>Ce réglage s'applique à tous les chats privés du bot.</Text>
      <View style={styles.card}>
        <Text style={styles.val}>{current.label}</Text>
        <Text style={styles.key}>{current.hint}</Text>
      </View>
      {menu.type === 'web_app' ? (
        <View style={styles.fields}>
          <ReadOnlyField label={texts.menuText} value={menu.text} />
          <ReadOnlyField label={texts.menuUrl} value={menu.url} />
        </View>
      ) : null}
    </View>
  );
}