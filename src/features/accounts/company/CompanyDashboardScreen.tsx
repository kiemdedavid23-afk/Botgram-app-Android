import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, RefreshControl, View, StyleSheet} from 'react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {useAccess} from '../useAccess';
import {useWorkspaceStore} from '../store/workspaceStore';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {botState, clockLabel, quotaLevel, quotaNote, teamFill, TEAM_MAX} from './companyLogic';
import {companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {Rise} from './components/Rise';
import {HeroStats} from './components/HeroStats';
import {BotsCard} from './components/BotsCard';
import {TeamCard} from './components/TeamCard';
import {ActionsCard} from './components/ActionsCard';

type Props = {
  onAddBot: () => void;
  onOpenBot?: () => void;
  onOpenTeam?: () => void;
  onOpenGestion?: () => void;
  onOpenProfile?: () => void;
};

const noop = (): void => undefined;

export function CompanyDashboardScreen({
  onAddBot,
  onOpenBot,
  onOpenTeam = noop,
  onOpenGestion = noop,
  onOpenProfile = noop,
}: Props): React.JSX.Element {
  const t = useCompanyTheme();
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

  const online = bots.filter(b => botState(b.status) === 'online').length;
  const team = ws?.members_count ?? 1;
  const reset = clockLabel(quota?.resets_at ?? null);
  const used = quota?.used ?? null;
  const limit = quota?.limit ?? null;

  const level = quotaLevel(used, limit);

  return (
    <View style={styles.root}>
      <GradientView colors={[t.bg, t.bgGlow]} angle={165} style={StyleSheet.absoluteFill} />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor={t.primary}
            onRefresh={() => {
              fireAndForget(onRefresh());
            }}
          />
        }>
        <Rise index={0}>
          <HeroStats
            title="Aujourd’hui"
            onOpen={onOpenGestion}
            openLabel="Ouvrir la gestion"
            main={{
              label: 'Envois aujourd’hui',
              value: used === null ? '–' : String(used),
              of: limit === null ? undefined : `/ ${limit}`,
              fill: used !== null && limit ? used / limit : undefined,
              level,
              note: quotaNote(level, reset),
            }}
            tiles={[
              {
                label: 'Bots en ligne',
                value: String(online),
                of: `/ ${bots.length}`,
                fill: bots.length ? online / bots.length : 0,
                onPress: onOpenGestion,
              },
              {
                label: 'Équipe',
                value: String(team),
                of: `/ ${TEAM_MAX}`,
                fill: teamFill(team),
                onPress: onOpenTeam,
              },
            ]}
          />
        </Rise>
        <Rise index={1}>
          <BotsCard
            bots={bots}
            busy={busy}
            onGestion={onOpenGestion}
            onLink={access.canLinkBot ? onAddBot : undefined}
            onOpen={bot => {
              fireAndForget(
                selectBot(bot.id).then(res => {
                  if (res.ok) onOpenBot?.();
                }),
              );
            }}
          />
        </Rise>
        {ws ? (
          <Rise index={2}>
            <TeamCard count={ws.members_count} ownerName={ws.owner.display_name} onOpen={onOpenTeam} />
          </Rise>
        ) : null}
        <Rise index={3}>
          <ActionsCard
            onInvite={access.canManageTeam ? onOpenTeam : undefined}
            onProfile={onOpenProfile}
            onLink={access.canLinkBot ? onAddBot : undefined}
          />
        </Rise>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {
    paddingHorizontal: cm.pageH,
    paddingTop: cm.pageTop,
    paddingBottom: cm.pageBottom,
    gap: cm.sectionGap,
  },
});
