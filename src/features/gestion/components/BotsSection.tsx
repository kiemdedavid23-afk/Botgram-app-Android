/**
 * Section Mes bots — extrait de GestionScreen (≤300 lignes).
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import type {Bot} from '../../../core/api/endpoints/bots';
import {BotCard} from './BotCard';
import {texts} from '../texts';

type Props = {
  bots: Bot[];
  selectedBotId: string | null | undefined;
  busy: string | null;
  onRetry: (id: string) => void;
  onResync: (id: string) => void;
  onDisconnect: (id: string) => void;
  onDelete: (id: string) => void;
};

export function BotsSection({
  bots,
  selectedBotId,
  busy,
  onRetry,
  onResync,
  onDisconnect,
  onDelete,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <View style={styles.section}>
      <View style={styles.sectionHead}>
        <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
          {texts.sectionBots}
        </Text>
        <View style={[styles.count, {backgroundColor: colors.bgTertiary}]}>
          <Text style={[styles.countText, {color: colors.textSecondary}]}>
            {texts.botsCount(bots.length)}
          </Text>
        </View>
      </View>
      {bots.length === 0 ? (
        <View
          style={[
            styles.empty,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
            {texts.emptyBotsTitle}
          </Text>
          <Text style={[styles.emptySub, {color: colors.textSecondary}]}>
            {texts.emptyBotsSub}
          </Text>
        </View>
      ) : (
        bots.map(bot => (
          <BotCard
            key={bot.id}
            bot={bot}
            isDefault={selectedBotId === bot.id}
            busyKey={busy}
            onRetry={() => onRetry(bot.id)}
            onResync={() => onResync(bot.id)}
            onDisconnect={() => onDisconnect(bot.id)}
            onDelete={() => onDelete(bot.id)}
          />
        ))
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: 10},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: g.sectionHeadPadH,
  },
  sectionTitle: {
    fontSize: g.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: g.sectionTitleLetter * g.sectionTitleSize,
    textTransform: 'uppercase',
  },
  count: {
    borderRadius: 99,
    paddingVertical: g.countPadV,
    paddingHorizontal: g.countPadH,
  },
  countText: {fontSize: g.countFont, fontWeight: '600'},
  empty: {borderRadius: g.cardRadius, padding: g.cardPad, gap: 4},
  emptyTitle: {fontWeight: '700', fontSize: 15},
  emptySub: {fontSize: g.headSubSize},
});
