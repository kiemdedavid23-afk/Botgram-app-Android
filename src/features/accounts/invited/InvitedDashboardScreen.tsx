/** Tableau de bord d'un compte invité : l'entreprise qui l'accueille, ses bots, le quota d'équipe. */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, ScrollView, RefreshControl, StyleSheet} from 'react-native';
import {Building2} from 'lucide-react-native';
import {useTheme, dashboardMetrics as dm, getShadow, radii} from '../../../shared/theme';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';
import {SectionHeader} from '../../dashboard/components/SectionHeader';
import {BotCard} from '../../dashboard/components/BotSlot';
import {QuotaCard} from '../../dashboard/components/QuotaCard';
import {useWorkspaceStore} from '../store/workspaceStore';
import {useAccess} from '../useAccess';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {inviteRoleLabel, inviteRoleHint} from './invitedLogic';

type Props = {onOpenBot?: () => void; onOpenTeam?: () => void};

export function InvitedDashboardScreen({onOpenBot, onOpenTeam}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const access = useAccess();
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const loadWs = useWorkspaceStore(s => s.load);
  const bots = useBotsStore(s => s.bots);
  const loadBots = useBotsStore(s => s.load);
  const selectBot = useBotsStore(s => s.select);
  const busy = useBotsStore(s => s.busy);
  const quota = useQuotaStore(s => s.quota);
  const loadQuota = useQuotaStore(s => s.load);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fireAndForget(loadWs());
    fireAndForget(loadBots());
    fireAndForget(loadQuota());
  }, [loadWs, loadBots, loadQuota]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([loadWs(true), loadBots(true), loadQuota(true)]);
    setRefreshing(false);
  }, [loadWs, loadBots, loadQuota]);

  return (
    <ScrollView
      style={{backgroundColor: colors.bgSecondary}}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.accent}
          onRefresh={() => {
            fireAndForget(onRefresh());
          }}
        />
      }>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft},
          getShadow('sm', mode),
        ]}>
        <View style={[styles.icon, {backgroundColor: colors.accentSoft}]}>
          <Building2 size={22} color={colors.accent} />
        </View>
        <View style={styles.flex}>
          <Text style={[styles.title, {color: colors.textPrimary}]} numberOfLines={1}>
            {ws?.name ?? 'Votre entreprise'}
          </Text>
          <Text style={[styles.sub, {color: colors.textSecondary}]} numberOfLines={1}>
            {ws ? `Responsable : ${ws.owner.display_name}` : '…'}
          </Text>
        </View>
        <View style={[styles.chip, {backgroundColor: colors.accentSoft}]}>
          <Text style={[styles.chipText, {color: colors.accent}]}>
            {inviteRoleLabel(access.role)}
          </Text>
        </View>
      </View>
      <Text style={[styles.hint, {color: colors.textSecondary}]}>
        {inviteRoleHint(access.role)}
      </Text>

      <View style={styles.section}>
        <SectionHeader title="Bots de l’entreprise" count={bots.length} />
        <View style={styles.list}>
          {bots.map(bot => (
            <BotCard
              key={bot.id}
              bot={bot}
              busy={!!busy[`select:${bot.id}`]}
              onPress={() => {
                fireAndForget(
                  selectBot(bot.id).then(res => {
                    if (res.ok) onOpenBot?.();
                  }),
                );
              }}
            />
          ))}
        </View>
      </View>

      {onOpenTeam ? (
        <Pressable accessibilityRole="button" onPress={onOpenTeam} style={[styles.chip, styles.teamBtn, {backgroundColor: colors.accentSoft}]}>
          <Text style={[styles.chipText, {color: colors.accent}]}>Voir l’équipe</Text>
        </Pressable>
      ) : null}

      <View style={styles.section}>
        <SectionHeader title="Quota de l’équipe" />
        <QuotaCard
          used={quota?.used ?? null}
          limit={quota?.limit ?? null}
          remaining={quota?.remaining ?? null}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {
    paddingHorizontal: dm.pagePaddingH,
    paddingTop: dm.pagePaddingTop,
    paddingBottom: dm.pagePaddingBottom,
    gap: dm.sectionGap,
  },
  card: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: radii.lg, borderWidth: 1},
  icon: {width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center'},
  title: {fontSize: 16, fontWeight: '700'},
  sub: {fontSize: 13, marginTop: 2},
  chip: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999},
  chipText: {fontSize: 12, fontWeight: '700'},
  teamBtn: {alignSelf: 'flex-start', paddingVertical: 8, paddingHorizontal: 14},
  hint: {fontSize: 13, lineHeight: 19, marginTop: -8},
  section: {gap: dm.sectionInnerGap},
  list: {gap: dm.botListGap},
});
