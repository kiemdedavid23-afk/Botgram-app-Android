import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {Bot} from '../../../../core/api/endpoints/bots';
import {BotPhoto} from '../../../../shared/components/BotPhoto';
import {botState, botStateLabel, botTintIndex} from '../companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';
import {Card, CardTitle, Divider, OutlineButton, StatusDot, Tile} from './ui';

type Props = {
  bots: readonly Bot[];
  busy: Record<string, boolean>;
  onOpen: (bot: Bot) => void;
  onGestion: () => void;
  /** Absent : pas de bouton « Lier un bot » (jamais pour un invité). */
  onLink?: () => void;
};

const AVATAR = 40;

/** Les bots de l'entreprise : photo du bot (ou initiale sur une teinte propre à chaque bot), nom, état. */
export function BotsCard({bots, busy, onOpen, onGestion, onLink}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Card>
      <CardTitle title="Bots de l’entreprise" onPress={onGestion} actionLabel="Ouvrir la gestion des bots" />
      {bots.length === 0 ? (
        <View style={styles.empty}>
          <Text style={[styles.emptySub, {color: t.inkSoft}]}>
            Aucun bot lié pour le moment. Liez le premier pour que votre équipe réponde à vos clients.
          </Text>
          {onLink ? <OutlineButton label="+ Lier un bot" onPress={onLink} /> : null}
        </View>
      ) : (
        <View style={styles.list}>
          {bots.map((bot, i) => {
            const s = botState(bot.status);
            const dot = s === 'online' ? t.good : s === 'attention' ? t.warn : t.inkSoft;
            const tint = t.botTints[botTintIndex(bot.id, t.botTints.length)] ?? t.primary;
            return (
              <React.Fragment key={bot.id}>
                {i > 0 ? <Divider /> : null}
                <Pressable
                  accessibilityRole="button"
                  disabled={!!busy[`select:${bot.id}`]}
                  onPress={() => onOpen(bot)}
                  style={({pressed}) => [styles.row, pressed ? {opacity: 0.7} : null]}>
                  <Tile>
                    <BotPhoto
                      botId={bot.id}
                      style={styles.photo}
                      fallback={
                        <View style={[styles.letter, {backgroundColor: tint}]}>
                          <Text style={styles.letterText}>{(bot.name.trim()[0] ?? '?').toUpperCase()}</Text>
                        </View>
                      }
                    />
                  </Tile>
                  <View style={styles.main}>
                    <Text style={[styles.name, {color: t.ink}]} numberOfLines={1}>
                      {bot.name}
                    </Text>
                    <Text style={[styles.sub, {color: t.inkSoft}]} numberOfLines={1}>
                      {`${bot.username ? `@${bot.username} · ` : ''}${botStateLabel(bot.status)}`}
                    </Text>
                  </View>
                  <StatusDot color={dot} live={s === 'online'} />
                </Pressable>
              </React.Fragment>
            );
          })}
        </View>
      )}
    </Card>
  );
}

const styles = StyleSheet.create({
  list: {marginTop: 14},
  row: {flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12},
  main: {flex: 1},
  photo: {width: AVATAR, height: AVATAR, borderRadius: 12},
  letter: {width: AVATAR, height: AVATAR, borderRadius: 12, alignItems: 'center', justifyContent: 'center'},
  letterText: {color: '#FFFFFF', fontFamily: companyFonts.display, fontSize: cm.bodySize + 1, fontWeight: '700'},
  name: {fontFamily: companyFonts.display, fontSize: cm.rowTitleSize, fontWeight: '600'},
  sub: {fontFamily: companyFonts.body, fontSize: cm.subSize, marginTop: 2},
  empty: {gap: 16, marginTop: 10},
  emptySub: {fontFamily: companyFonts.body, fontSize: cm.subSize, lineHeight: 22},
});
