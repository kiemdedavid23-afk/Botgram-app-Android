/**
 * Page Gestion — GestionPage.tsx + .css
 * Route MemberStack « Gestion ». Notifications exclues (étape 8).
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet, Switch} from 'react-native';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import {useBotsStore} from '../../bots';
import {useAuthStore} from '../../auth';
import {useMemberStore} from '../../member';
import {me} from '../../../core/api/endpoints/auth';
import {useGestionStore} from '../store/gestionStore';
import {BotCard} from '../components/BotCard';
import {ConfirmDialog} from '../components/ConfirmDialog';
import {GestionToast} from '../components/GestionToast';
import {DevicesSection} from '../components/DevicesSection';
import {PrefsSection} from '../components/PrefsSection';
import {texts} from '../texts';
import {gestionErrorMessage} from '../utils/errors';
import {TIMEZONES} from '../utils/format';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {HttpResult} from '../../../core/api/session';

type Confirm =
  | {kind: 'disconnect'; botId: string}
  | {kind: 'delete'; botId: string}
  | {kind: 'revoke'; sessionId: string}
  | {kind: 'logoutAll'};

export function GestionScreen(): React.JSX.Element {
  const {colors, mode} = useTheme();
  const bots = useBotsStore(s => s.bots);
  const loadBots = useBotsStore(s => s.load);
  const retryWebhook = useBotsStore(s => s.retryWebhook);
  const resyncWebhook = useBotsStore(s => s.resyncWebhook);
  const disconnect = useBotsStore(s => s.disconnect);
  const deleteBot = useBotsStore(s => s.deleteBot);
  const member = useAuthStore(s => s.member);
  const setMember = useMemberStore(s => s.setMember);
  const sessions = useGestionStore(s => s.sessions);
  const sessionsLoading = useGestionStore(s => s.sessionsLoading);
  const loadSessions = useGestionStore(s => s.loadSessions);
  const revokeSession = useGestionStore(s => s.revokeSession);
  const logoutAllSessions = useGestionStore(s => s.logoutAllSessions);
  const timezone = useGestionStore(s => s.timezone);
  const setTimezone = useGestionStore(s => s.setTimezone);
  const hydrateTimezone = useGestionStore(s => s.hydrateTimezone);

  const [busy, setBusy] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [dropPending, setDropPending] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    fireAndForget(loadBots(true));
    fireAndForget(loadSessions());
    fireAndForget(hydrateTimezone());
  }, [loadBots, loadSessions, hydrateTimezone]);

  const showToast = useCallback((msg: string) => setToast(msg), []);

  const mapResult = (res: HttpResult<unknown>, okMsg: string) => {
    if (res.ok) {
      showToast(okMsg);
      return true;
    }
    showToast(gestionErrorMessage(res.error.code));
    return false;
  };

  const runBot = async (
    key: string,
    fn: () => Promise<HttpResult<unknown>>,
    okMsg: string,
  ) => {
    if (busy) return;
    setBusy(key);
    const res = await fn();
    setBusy(null);
    mapResult(res, okMsg);
  };

  const onConfirm = async () => {
    const c = confirm;
    if (!c || busy) return;
    setConfirm(null);
    if (c.kind === 'disconnect') {
      await runBot(
        `${c.botId}:disconnect`,
        () => disconnect(c.botId, dropPending),
        texts.toastDisconnected,
      );
      fireAndForget(loadBots(true));
    } else if (c.kind === 'delete') {
      const wasDefault = member?.selected_bot_id === c.botId;
      await runBot(
        `${c.botId}:delete`,
        () => deleteBot(c.botId),
        texts.toastDeleted,
      );
      fireAndForget(loadBots(true));
      if (wasDefault) {
        const res = await me();
        if (res.ok) {
          setMember(res.data.member);
          useAuthStore.getState().setMember(res.data.member);
        }
      }
    } else if (c.kind === 'revoke') {
      setBusy(`session:${c.sessionId}`);
      const r = await revokeSession(c.sessionId);
      setBusy(null);
      showToast(r === 'ok' ? texts.toastSessionRevoked : texts.toastErrorGeneric);
    } else {
      setBusy('logoutAll');
      const r = await logoutAllSessions();
      setBusy(null);
      showToast(r === 'ok' ? texts.toastLogoutAll : texts.toastErrorGeneric);
    }
  };

  const cycleTimezone = () => {
    const idx = TIMEZONES.findIndex(z => z === timezone);
    const next =
      timezone === 'auto'
        ? TIMEZONES[0]
        : idx < 0 || idx >= TIMEZONES.length - 1
          ? 'auto'
          : TIMEZONES[idx + 1];
    setTimezone(next ?? 'auto');
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.head}>
          <Text style={[styles.headTitle, {color: colors.textPrimary}]}>
            {texts.title}
          </Text>
          <Text style={[styles.headSub, {color: colors.textSecondary}]}>
            {texts.subtitle}
          </Text>
        </View>

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
                isDefault={member?.selected_bot_id === bot.id}
                busyKey={busy}
                onRetry={() =>
                  fireAndForget(
                    runBot(
                      `${bot.id}:retry`,
                      () => retryWebhook(bot.id),
                      texts.toastRetry,
                    ),
                  )
                }
                onResync={() =>
                  fireAndForget(
                    runBot(
                      `${bot.id}:resync`,
                      () => resyncWebhook(bot.id),
                      texts.toastResync,
                    ),
                  )
                }
                onDisconnect={() => {
                  setDropPending(false);
                  setConfirm({kind: 'disconnect', botId: bot.id});
                }}
                onDelete={() => setConfirm({kind: 'delete', botId: bot.id})}
              />
            ))
          )}
        </View>

        <DevicesSection
          sessions={sessions}
          loading={sessionsLoading}
          onRevoke={id => setConfirm({kind: 'revoke', sessionId: id})}
          onLogoutAll={() => setConfirm({kind: 'logoutAll'})}
        />

        <PrefsSection
          timezone={timezone}
          onTimezoneCycle={cycleTimezone}
          onLanguagePress={() => showToast(texts.languageFr)}
        />
      </ScrollView>

      <ConfirmDialog
        visible={confirm !== null}
        title={
          confirm?.kind === 'disconnect'
            ? texts.confirmDisconnectTitle
            : confirm?.kind === 'delete'
              ? texts.confirmDeleteTitle
              : confirm?.kind === 'revoke'
                ? texts.confirmRevokeTitle
                : texts.confirmLogoutAllTitle
        }
        body={
          confirm?.kind === 'disconnect'
            ? texts.confirmDisconnectBody
            : confirm?.kind === 'delete'
              ? texts.confirmDeleteBody
              : confirm?.kind === 'revoke'
                ? texts.confirmRevokeBody
                : texts.confirmLogoutAllBody
        }
        danger={confirm?.kind !== 'disconnect'}
        extra={
          confirm?.kind === 'disconnect' ? (
            <Pressable
              onPress={() => setDropPending(v => !v)}
              style={styles.checkRow}>
              <Switch
                value={dropPending}
                onValueChange={setDropPending}
                trackColor={{true: colors.accent}}
              />
              <Text style={[styles.checkLabel, {color: colors.textPrimary}]}>
                {texts.dropPending}
              </Text>
            </Pressable>
          ) : null
        }
        busy={!!busy}
        onCancel={() => setConfirm(null)}
        onConfirm={() => {
          fireAndForget(onConfirm());
        }}
      />
      <GestionToast message={toast} onHide={() => setToast('')} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {
    paddingHorizontal: g.scrollPadH,
    paddingTop: g.scrollPadTop,
    paddingBottom: g.scrollPadBottom,
    gap: g.sectionGap,
  },
  head: {gap: g.headGap},
  headTitle: {fontSize: g.headTitleSize, fontWeight: g.headTitleWeight},
  headSub: {fontSize: g.headSubSize},
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
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: g.dialogPad,
    paddingTop: 12,
  },
  emptySub: {fontSize: g.headSubSize},
  checkLabel: {flex: 1},
});
