/** Profil Telegram du bot — 6 onglets (site BotProfilePage). */
import React, {useEffect, useMemo, useState} from 'react';
import {
  View, Text, ScrollView, Pressable, StyleSheet, ActivityIndicator,
} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {useBotsStore} from '../../bots';
import {useBotProfileStore} from '../store/botProfileStore';
import {BotHero} from '../components/BotHero';
import {IdentitySection} from '../components/IdentitySection';
import {LanguagesSection} from '../components/LanguagesSection';
import {CommandsSection} from '../components/CommandsSection';
import {MenuSection} from '../components/MenuSection';
import {RightsSection} from '../components/RightsSection';
import {InfoSection} from '../components/InfoSection';
import {TelegramPreview} from '../components/TelegramPreview';
import {SaveBar} from '../components/SaveBar';
import {hasChanges, validate} from '../utils/diff';
import {setCommands, setMenuButton, setRight, setRights} from '../utils/edit';
import {
  ADMIN_RIGHT_KEYS, DEFAULT_LANG, emptyRights,
} from '../../../core/api/endpoints/botProfile.types';
import type {AdminRightKey} from '../../../core/api/endpoints/botProfile.types';
import {RIGHT_SCOPE} from '../utils/labels';
import {PROFILE_TABS, type TabId} from '../utils/tabs';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {onAddBot?: () => void};

function keysFor(target: 'groups' | 'channels'): AdminRightKey[] {
  return ADMIN_RIGHT_KEYS.filter(k => {
    const s = RIGHT_SCOPE[k];
    return s === 'both' || s === target;
  });
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bgSecondary},
    center: {
      alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24,
    },
    emptyTitle: {fontSize: 18, fontWeight: '700', color: c.textPrimary},
    sub: {textAlign: 'center', color: c.textSecondary},
    cta: {
      marginTop: 8, paddingVertical: 12, paddingHorizontal: 20,
      borderRadius: m.inputRadius, backgroundColor: c.accent,
    },
    ctaText: {fontWeight: '700', color: c.white},
    err: {textAlign: 'center', color: c.danger},
    scroll: {
      paddingHorizontal: m.scrollPadH, paddingBottom: m.scrollPadBottom,
      gap: m.scrollGap, paddingTop: 12,
    },
    tabs: {flexDirection: 'row', gap: m.gap, paddingVertical: m.paddingV},
    tab: {
      flexDirection: 'row', alignItems: 'center', gap: 6,
      paddingVertical: m.tabPadV, paddingHorizontal: m.tabPadH,
      borderRadius: m.tabRadius, minHeight: m.tabRowMinHeight,
    },
    tabOn: {backgroundColor: c.accent},
    tabOff: {backgroundColor: c.bgPrimary},
    tabTextOn: {fontSize: m.tabLabelSize, fontWeight: '700', color: c.white},
    tabTextOff: {fontSize: m.tabLabelSize, fontWeight: '700', color: c.textSecondary},
    head: {gap: 2, paddingHorizontal: 4, paddingBottom: 12},
    headTitle: {
      fontSize: m.headTitleSize, fontWeight: m.headTitleWeight,
      letterSpacing: -0.01, color: c.textPrimary,
    },
    headHint: {
      fontSize: m.headHintSize, lineHeight: m.headHintLineHeight,
      color: c.textSecondary,
    },
    report: {
      padding: m.reportPad, borderRadius: m.inputRadius, gap: 6,
      backgroundColor: c.bgPrimary,
    },
    reportTitle: {fontWeight: '700', marginBottom: 4, color: c.textPrimary},
    reportLineOk: {fontSize: m.reportLineSize, color: c.online},
    reportLineErr: {fontSize: m.reportLineSize, color: c.danger},
    reportClose: {fontWeight: '600', marginTop: 8, color: c.accent},
  });
}

export function BotProfileScreen({onAddBot}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const member = useAuthStore(s => s.member);
  const bots = useBotsStore(s => s.bots);
  const loadBots = useBotsStore(s => s.load);
  const botId = member?.selected_bot_id ?? null;
  const bot = bots.find(b => b.id === botId);
  const draft = useBotProfileStore(s => s.draft);
  const saved = useBotProfileStore(s => s.saved);
  const loading = useBotProfileStore(s => s.loading);
  const saving = useBotProfileStore(s => s.saving);
  const loadError = useBotProfileStore(s => s.loadError);
  const report = useBotProfileStore(s => s.report);
  const load = useBotProfileStore(s => s.load);
  const edit = useBotProfileStore(s => s.edit);
  const discard = useBotProfileStore(s => s.discard);
  const save = useBotProfileStore(s => s.save);
  const dismissReport = useBotProfileStore(s => s.dismissReport);
  const [tab, setTab] = useState<TabId>('identity');
  const [lang, setLang] = useState(DEFAULT_LANG);

  useEffect(() => { fireAndForget(loadBots()); }, [loadBots]);
  const botName = bot?.name ?? '';
  const botUsername = bot?.username ?? undefined;
  const botTelegramId = bot ? String(bot.telegram_bot_id) : '';
  useEffect(() => {
    if (!botId || !botName) return;
    setLang(DEFAULT_LANG);
    fireAndForget(load(botId, {
      name: botName, username: botUsername, telegram_id: botTelegramId,
    }));
  }, [botId, botName, botUsername, botTelegramId, load]);

  const dirty = hasChanges(saved, draft);
  const errors = useMemo(() => (draft ? validate(draft) : {}), [draft]);
  const currentTab = PROFILE_TABS.find(t => t.id === tab) ?? PROFILE_TABS[0]!;

  if (!botId || !bot) {
    return (
      <View style={[styles.root, styles.center]}>
        <Text style={styles.emptyTitle}>{texts.noBotTitle}</Text>
        <Text style={styles.sub}>{texts.noBotSub}</Text>
        {onAddBot ? (
          <Pressable onPress={onAddBot} style={styles.cta}>
            <Text style={styles.ctaText}>{texts.noBotCta}</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if ((loading && !draft) || (!draft && !loadError) || (!draft || !saved)) {
    return (
      <View style={[styles.root, styles.center]}>
        {loadError && !draft ? (
          <>
            <Text style={styles.err}>{loadError}</Text>
            <Pressable
              onPress={() => fireAndForget(load(botId, {
                name: bot.name,
                username: bot.username ?? undefined,
                telegram_id: String(bot.telegram_bot_id),
              }, true))}
              style={styles.cta}>
              <Text style={styles.ctaText}>{texts.retry}</Text>
            </Pressable>
          </>
        ) : (
          <ActivityIndicator color={colors.accent} />
        )}
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BotHero profile={draft} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <View style={styles.tabs}>
            {PROFILE_TABS.map(t => {
              const on = t.id === tab;
              const Icon = t.Icon;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setTab(t.id)}
                  style={[styles.tab, on ? styles.tabOn : styles.tabOff]}>
                  <Icon
                    size={m.tabIconSize}
                    color={on ? colors.white : colors.textSecondary}
                  />
                  <Text style={on ? styles.tabTextOn : styles.tabTextOff}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </ScrollView>
        <View style={styles.head}>
          <Text style={styles.headTitle}>{currentTab.title}</Text>
          <Text style={styles.headHint}>{currentTab.hint}</Text>
        </View>
        {tab === 'identity' ? (
          <IdentitySection draft={draft} lang={lang} onLang={setLang} onEdit={edit} />
        ) : null}
        {tab === 'languages' ? (
          <LanguagesSection draft={draft} onEdit={edit} />
        ) : null}
        {tab === 'commands' ? (
          <CommandsSection
            draft={draft} lang={lang} onLang={setLang} errors={errors}
            onChange={(key, list) => edit(d => setCommands(d, key, list))}
          />
        ) : null}
        {tab === 'menu' ? (
          <MenuSection
            draft={draft} errors={errors}
            onChange={b => edit(d => setMenuButton(d, b))}
          />
        ) : null}
        {tab === 'rights' ? (
          <RightsSection
            draft={draft}
            onToggle={(target, key, value) => edit(d => setRight(d, target, key, value))}
            onSetAll={(target, value) => {
              const next = {...emptyRights()};
              const scoped = keysFor(target);
              for (const k of ADMIN_RIGHT_KEYS) {
                next[k] = scoped.includes(k) ? value : draft.admin_rights[target][k];
              }
              edit(d => setRights(d, target, next));
            }}
          />
        ) : null}
        {tab === 'info' ? (
          <InfoSection
            profile={draft} saved={saved} draft={draft}
            onResync={() => fireAndForget(load(botId, {
              name: bot.name,
              username: bot.username ?? undefined,
              telegram_id: String(bot.telegram_bot_id),
            }, true))}
          />
        ) : null}
        {tab === 'identity' || tab === 'menu' || tab === 'commands' ? (
          <TelegramPreview profile={draft} lang={lang} />
        ) : null}
        {report ? (
          <View style={styles.report}>
            <Text style={styles.reportTitle}>{texts.reportTitle}</Text>
            {report.map(r => (
              <Text
                key={r.id}
                style={r.ok ? styles.reportLineOk : styles.reportLineErr}>
                {r.label}: {r.message}
              </Text>
            ))}
            <Pressable onPress={dismissReport}>
              <Text style={styles.reportClose}>{texts.reportClose}</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      <SaveBar
        visible={dirty}
        saving={saving}
        onSave={() => { fireAndForget(save()); }}
        onDiscard={discard}
      />
    </View>
  );
}
