import React, {useCallback, useEffect, useState} from 'react';
import {ScrollView, RefreshControl, View, Text, StyleSheet} from 'react-native';
import {useAccess} from '../useAccess';
import {useWorkspaceStore} from '../store/workspaceStore';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {countryLabel, formatPhone, memberSince} from '../../member/utils/format';
import {botState} from './companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {Rise} from './components/Rise';
import {KpiStrip} from './components/KpiStrip';
import {QuotaPanel} from './components/QuotaPanel';
import {BotsTable} from './components/BotsTable';
import {TeamPanel} from './components/TeamPanel';
import {KeyValue, Panel, SectionLabel} from './components/Primitives';

type Props = {onAddBot: () => void; onOpenBot?: () => void; onOpenTeam?: () => void};

export function CompanyDashboardScreen({onAddBot, onOpenBot, onOpenTeam}: Props): React.JSX.Element {
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

  return (
    <ScrollView
      style={{backgroundColor: t.bg}}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={t.gold}
          onRefresh={() => {
            fireAndForget(onRefresh());
          }}
        />
      }>
      <Rise index={0}>
        <KpiStrip
          items={[
            {label: 'Envois restants', value: quota ? String(quota.remaining) : '–', hint: 'aujourd’hui'},
            {label: 'Bots actifs', value: `${online}/${bots.length}`, hint: 'en ligne'},
            {label: 'Équipe', value: String(team), hint: team > 1 ? 'personnes' : 'personne'},
          ]}
        />
      </Rise>

      <Rise index={1}>
        <SectionLabel>Quota d’envoi</SectionLabel>
        <QuotaPanel
          used={quota?.used ?? null}
          limit={quota?.limit ?? null}
          resetsAt={quota?.resets_at ?? null}
        />
      </Rise>

      <Rise index={2}>
        <SectionLabel right={String(bots.length)}>Bots de l’entreprise</SectionLabel>
        <BotsTable
          bots={bots}
          busy={busy}
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
        <Rise index={3}>
          <SectionLabel>Équipe</SectionLabel>
          <TeamPanel ownerName={ws.owner.display_name} count={ws.members_count} role={ws.role} onOpen={onOpenTeam} />
        </Rise>
      ) : null}

      {ws ? (
        <Rise index={4}>
          <SectionLabel>Fiche entreprise</SectionLabel>
          <Panel>
            <KeyValue label="Secteur" value={ws.sector ?? ''} />
            <KeyValue label="Pays" value={countryLabel(ws.country)} />
            <KeyValue label="Téléphone" value={formatPhone(ws.phone)} />
            <KeyValue label="Créée le" value={memberSince(ws.created_at)} last />
          </Panel>
        </Rise>
      ) : (
        <View style={styles.hint}>
          <Text style={[styles.hintText, {color: t.inkSoft}]}>Chargement de la fiche entreprise…</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: cm.pageH,
    paddingTop: cm.pageTop,
    paddingBottom: cm.pageBottom,
    gap: cm.sectionGap,
  },
  hint: {alignItems: 'center', padding: 12},
  hintText: {fontFamily: companyFonts.body, fontSize: 13},
});
