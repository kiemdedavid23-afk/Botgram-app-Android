/** Profil Telegram du bot — 4 onglets (Identité, Langues, Commandes, Infos), lecture seule. */
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
import {InfoSection} from '../components/InfoSection';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {PROFILE_TABS, type TabId} from '../utils/tabs';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {onAddBot?: () => void};

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {flex: 1, backgroundColor: c.bgSecondary},
    center: {
      alignItems: 'center', justifyContent: 'center', gap: m.centerGap, padding: m.centerPad,
    },
    emptyTitle: {fontSize: m.emptyTitleSize, fontWeight: m.emptyTitleWeight, color: c.textPrimary},
    sub: {textAlign: 'center', color: c.textSecondary},
    cta: {
      marginTop: m.ctaMarginTop, paddingVertical: m.ctaPadV, paddingHorizontal: m.ctaPadH,
      borderRadius: m.inputRadius, backgroundColor: c.accent,
    },
    ctaText: {fontWeight: m.ctaTextWeight, color: c.white},
    err: {textAlign: 'center', color: c.danger},
    scroll: {
      paddingHorizontal: m.scrollPadH, paddingBottom: m.scrollPadBottom,
      gap: m.scrollGap, paddingTop: m.scrollPadTop,
    },
    tabsBar: {backgroundColor: c.bgSecondary},
    tabs: {flexDirection: 'row', gap: m.gap, paddingVertical: m.paddingV},
    tab: {
      flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: m.tabIconGap,
      paddingVertical: m.tabPadV, paddingHorizontal: m.tabPadH,
      borderRadius: m.tabRadius, minHeight: m.tabRowMinHeight,
    },
    tabOn: {backgroundColor: c.accent},
    tabOff: {backgroundColor: c.bgPrimary},
    tabTextOn: {fontSize: m.tabLabelSize, fontWeight: m.tabFontWeight, color: c.white},
    tabTextOff: {fontSize: m.tabLabelSize, fontWeight: m.tabFontWeight, color: c.textSecondary},
    head: {gap: m.headGap, paddingBottom: m.headPadBottom},
    headTitle: {
      fontSize: m.headTitleSize, fontWeight: m.headTitleWeight,
      letterSpacing: m.letterSpacingTight, color: c.textPrimary,
    },
    headHint: {
      fontSize: m.headHintSize, lineHeight: m.headHintLineHeight,
      color: c.textSecondary,
    },
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
  const profile = useBotProfileStore(s => s.saved);
  const loading = useBotProfileStore(s => s.loading);
  const loadError = useBotProfileStore(s => s.loadError);
  const load = useBotProfileStore(s => s.load);
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

  const resync = () => fireAndForget(load(botId, {
    name: bot.name,
    username: bot.username ?? undefined,
    telegram_id: String(bot.telegram_bot_id),
  }, true));

  if (!profile) {
    return (
      <View style={[styles.root, styles.center]}>
        {loadError ? (
          <>
            <Text style={styles.err}>{loadError}</Text>
            <Pressable onPress={resync} style={styles.cta}>
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
        <BotHero key={profile.bot_id} profile={profile} status={bot.status} />
        <View style={styles.tabsBar}>
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
        </View>
        <View style={styles.head}>
          <Text style={styles.headTitle}>{currentTab.title}</Text>
          <Text style={styles.headHint}>{currentTab.hint}</Text>
        </View>
        {tab === 'identity' ? (
          <IdentitySection profile={profile} lang={lang} onLang={setLang} />
        ) : null}
        {tab === 'languages' ? <LanguagesSection profile={profile} /> : null}
        {tab === 'commands' ? (
          <CommandsSection profile={profile} lang={lang} onLang={setLang} />
        ) : null}
        {tab === 'info' ? (
          <InfoSection
            profile={profile}
            status={bot.status}
            loading={loading}
            onResync={resync}
          />
        ) : null}
      </ScrollView>
    </View>
  );
}
