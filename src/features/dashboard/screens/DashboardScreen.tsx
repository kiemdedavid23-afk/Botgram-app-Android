/**
 * Tableau de bord membre — fidélité visuelle DashboardPage.
 */
import React, {useCallback, useEffect, useRef, useState} from 'react';
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  Animated,
} from 'react-native';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {HeroCard} from '../components/HeroCard';
import {SectionHeader} from '../components/SectionHeader';
import {BotCard, AddBotSlot} from '../components/BotSlot';
import {QuotaCard} from '../components/QuotaCard';
import {AccountCard} from '../components/AccountCard';
import {texts} from '../texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type Props = {
  onAddBot: () => void;
};

export function DashboardScreen({onAddBot}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const member = useAuthStore(s => s.member);
  const bots = useBotsStore(s => s.bots);
  const loadBots = useBotsStore(s => s.load);
  const selectBot = useBotsStore(s => s.select);
  const busy = useBotsStore(s => s.busy);
  const quota = useQuotaStore(s => s.quota);
  const loadQuota = useQuotaStore(s => s.load);

  const [refreshing, setRefreshing] = useState(false);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    fireAndForget(loadBots());
    fireAndForget(loadQuota());
  }, [loadBots, loadQuota]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadBots(true), loadQuota(true)]);
    setRefreshing(false);
  }, [loadBots, loadQuota]);

  // cascade entry
  const fades = useRef(
    [0, 1, 2, 3].map(() => new Animated.Value(reduceMotion ? 1 : 0)),
  ).current;

  useEffect(() => {
    if (reduceMotion) {
      fades.forEach(v => v.setValue(1));
      return;
    }
    const anims = fades.map((v, i) =>
      Animated.timing(v, {
        toValue: 1,
        duration: 380,
        delay: 40 + i * 80,
        useNativeDriver: true,
      }),
    );
    Animated.parallel(anims).start();
  }, [reduceMotion, fades]);

  const sectionStyle = (i: number) => ({
    opacity: fades[i]!,
    transform: [
      {
        translateY: fades[i]!.interpolate({
          inputRange: [0, 1],
          outputRange: [14, 0],
        }),
      },
    ],
  });

  const remaining = quota?.remaining ?? null;
  const used = quota?.used ?? null;
  const limit = quota?.limit ?? null;

  return (
    <ScrollView
      style={[styles.root, {backgroundColor: colors.bgSecondary}]}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={() => {
            fireAndForget(onRefresh());
          }}
          tintColor={colors.accent}
        />
      }>
      <Animated.View style={sectionStyle(0)}>
        <HeroCard
          displayName={member?.display_name ?? null}
          botCount={bots.length}
          remaining={remaining}
        />
      </Animated.View>

      <Animated.View style={[styles.section, sectionStyle(1)]}>
        <SectionHeader title={texts.sectionBots} count={bots.length} />
        <View style={styles.botList}>
          {bots.map(bot => (
            <BotCard
              key={bot.id}
              bot={bot}
              busy={!!busy[`select:${bot.id}`]}
              onPress={() => {
                fireAndForget(selectBot(bot.id));
              }}
            />
          ))}
          <AddBotSlot onPress={onAddBot} />
        </View>
      </Animated.View>

      <Animated.View style={[styles.section, sectionStyle(2)]}>
        <SectionHeader title={texts.sectionQuota} />
        <QuotaCard used={used} limit={limit} remaining={remaining} />
      </Animated.View>

      <Animated.View style={[styles.section, sectionStyle(3)]}>
        <SectionHeader title={texts.sectionAccount} />
        <AccountCard
          createdAt={member?.created_at ?? null}
          botCount={bots.length}
        />
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {
    paddingHorizontal: dm.pagePaddingH,
    paddingTop: dm.pagePaddingTop,
    paddingBottom: dm.pagePaddingBottom,
    gap: dm.sectionGap,
  },
  section: {gap: 10},
  botList: {gap: dm.botListGap},
});
