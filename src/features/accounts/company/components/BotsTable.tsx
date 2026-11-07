import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronRight, Plus} from 'lucide-react-native';
import type {Bot} from '../../../../core/api/endpoints/bots';
import {botState, botStateLabel} from '../companyLogic';
import {companyFonts, useCompanyTheme} from '../companyTheme';
import {Panel, StatusDot} from './Primitives';

type Props = {
  bots: readonly Bot[];
  busy: Record<string, boolean>;
  onOpen: (bot: Bot) => void;
  /** Absent : pas de ligne « Lier un bot » (jamais pour un invité). */
  onLink?: () => void;
};

/** Les bots de l'entreprise en tableau : un bot par ligne, état à droite. */
export function BotsTable({bots, busy, onOpen, onLink}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Panel>
      {bots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyTitle, {color: t.ink}]}>Aucun bot lié</Text>
          <Text style={[styles.emptySub, {color: t.inkSoft}]}>
            Liez le premier bot de l’entreprise pour que votre équipe puisse répondre à ses clients.
          </Text>
        </View>
      ) : (
        bots.map((bot, i) => {
          const s = botState(bot.status);
          const color = s === 'online' ? t.good : s === 'attention' ? t.warn : t.lineStrong;
          return (
            <Pressable
              key={bot.id}
              accessibilityRole="button"
              disabled={!!busy[`select:${bot.id}`]}
              onPress={() => onOpen(bot)}
              style={({pressed}) => [
                styles.row,
                i > 0 ? {borderTopColor: t.line, borderTopWidth: StyleSheet.hairlineWidth} : null,
                pressed ? {backgroundColor: t.surfaceAlt} : null,
              ]}>
              <StatusDot color={color} live={s === 'online'} />
              <View style={styles.main}>
                <Text style={[styles.name, {color: t.ink}]} numberOfLines={1}>
                  {bot.name}
                </Text>
                <Text style={[styles.sub, {color: t.inkSoft}]} numberOfLines={1}>
                  {bot.username ? `@${bot.username}` : '—'}
                </Text>
              </View>
              <Text
                style={[
                  styles.state,
                  {color: s === 'online' ? t.good : s === 'attention' ? t.warn : t.inkSoft},
                ]}>
                {botStateLabel(bot.status)}
              </Text>
              <ChevronRight size={18} color={t.lineStrong} />
            </Pressable>
          );
        })
      )}
      {onLink ? (
        <Pressable
          accessibilityRole="button"
          onPress={onLink}
          style={({pressed}) => [
            styles.link,
            {borderTopColor: t.line, backgroundColor: pressed ? t.surfaceAlt : t.surface},
          ]}>
          <Plus size={16} color={t.gold} />
          <Text style={[styles.linkText, {color: t.gold}]}>Lier un bot</Text>
        </Pressable>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 13},
  main: {flex: 1},
  name: {fontFamily: companyFonts.value, fontSize: 15, fontWeight: '600'},
  sub: {fontFamily: companyFonts.body, fontSize: 12.5, marginTop: 1},
  state: {fontFamily: companyFonts.label, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.6},
  empty: {padding: 16, gap: 4},
  emptyTitle: {fontFamily: companyFonts.display, fontSize: 17, fontWeight: '700'},
  emptySub: {fontFamily: companyFonts.body, fontSize: 13, lineHeight: 19},
  link: {flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderTopWidth: 1},
  linkText: {fontFamily: companyFonts.label, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
});
