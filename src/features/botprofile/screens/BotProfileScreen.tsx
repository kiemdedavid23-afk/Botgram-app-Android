/**
 * Écran Profil Telegram du bot — L4b (Identité, Langues, Infos).
 * Route MemberStack « BotProfile ».
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {useBotsStore} from '../../bots';
import {useBotProfileStore} from '../store/botProfileStore';
import {BotHero} from '../components/BotHero';
import {IdentitySection} from '../components/IdentitySection';
import {LanguagesSection} from '../components/LanguagesSection';
import {InfoSection} from '../components/InfoSection';
import {SaveBar} from '../components/SaveBar';
import {hasChanges} from '../utils/diff';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Tab = 'identity' | 'languages' | 'info';

type Props = {
  onAddBot?: () => void;
};

export function BotProfileScreen({onAddBot}: Props): React.JSX.Element {
  const {colors} = useTheme();
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

  const [tab, setTab] = useState<Tab>('identity');
  const [lang, setLang] = useState(DEFAULT_LANG);

  useEffect(() => {
    fireAndForget(loadBots());
  }, [loadBots]);

  useEffect(() => {
    if (!botId || !bot) return;
    fireAndForget(
      load(botId, {
        name: bot.name,
        username: bot.username ?? undefined,
        telegram_id: String(bot.telegram_bot_id),
      }),
    );
    setLang(DEFAULT_LANG);
  }, [botId, bot?.id, load, bot]);

  const dirty = hasChanges(saved, draft);

  if (!botId || !bot) {
    return (
      <View style={[styles.root, styles.center, {backgroundColor: colors.bgSecondary}]}>
        <Text style={[styles.emptyTitle, {color: colors.textPrimary}]}>
          {texts.noBotTitle}
        </Text>
        <Text style={[styles.sub, {color: colors.textSecondary}]}>{texts.noBotSub}</Text>
        {onAddBot ? (
          <Pressable
            onPress={onAddBot}
            style={[styles.cta, {backgroundColor: colors.accent}]}>
            <Text style={[styles.ctaText, {color: colors.white}]}>
              {texts.noBotCta}
            </Text>
          </Pressable>
        ) : null}
      </View>
    );
  }

  if (loading && !draft) {
    return (
      <View style={[styles.root, styles.center, {backgroundColor: colors.bgSecondary}]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (loadError && !draft) {
    return (
      <View style={[styles.root, styles.center, {backgroundColor: colors.bgSecondary}]}>
        <Text style={[styles.err, {color: colors.danger}]}>{loadError}</Text>
        <Pressable
          onPress={() =>
            fireAndForget(
              load(
                botId,
                {
                  name: bot.name,
                  username: bot.username ?? undefined,
                  telegram_id: String(bot.telegram_bot_id),
                },
                true,
              ),
            )
          }
          style={[styles.cta, {backgroundColor: colors.accent}]}>
          <Text style={[styles.ctaText, {color: colors.white}]}>
            {texts.retry}
          </Text>
        </Pressable>
      </View>
    );
  }

  if (!draft) {
    return <View style={[styles.root, {backgroundColor: colors.bgSecondary}]} />;
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <BotHero profile={draft} />
        <View style={styles.tabs}>
          {(
            [
              ['identity', texts.tabIdentity],
              ['languages', texts.tabLanguages],
              ['info', texts.tabInfo],
            ] as const
          ).map(([id, label]) => (
            <Pressable
              key={id}
              onPress={() => setTab(id)}
              style={[
                styles.tab,
                {
                  backgroundColor:
                    tab === id ? colors.accentSoft : colors.bgTertiary,
                },
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: tab === id ? colors.accent : colors.textSecondary},
                ]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        {tab === 'identity' ? (
          <IdentitySection
            draft={draft}
            lang={lang}
            onLang={setLang}
            onEdit={edit}
          />
        ) : null}
        {tab === 'languages' ? (
          <LanguagesSection draft={draft} onEdit={edit} />
        ) : null}
        {tab === 'info' ? (
          <InfoSection
            profile={draft}
            saved={saved}
            draft={draft}
            onResync={() =>
              fireAndForget(
                load(
                  botId,
                  {
                    name: bot.name,
                    username: bot.username ?? undefined,
                    telegram_id: String(bot.telegram_bot_id),
                  },
                  true,
                ),
              )
            }
          />
        ) : null}
        {report ? (
          <View style={[styles.report, {backgroundColor: colors.bgPrimary}]}>
            <Text style={[styles.reportTitle, {color: colors.textPrimary}]}>
              {texts.reportTitle}
            </Text>
            {report.map(r => (
              <Text
                key={r.id}
                style={[
                  styles.reportLine,
                  {color: r.ok ? colors.badgeGoodText : colors.danger},
                ]}>
                {r.label}: {r.message}
              </Text>
            ))}
            <Pressable onPress={dismissReport}>
              <Text style={[styles.reportClose, {color: colors.accent}]}>
                {texts.reportClose}
              </Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
      <SaveBar
        visible={dirty}
        saving={saving}
        onSave={() => {
          fireAndForget(save());
        }}
        onDiscard={discard}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24},
  emptyTitle: {fontSize: 18, fontWeight: '700'},
  cta: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: m.inputRadius,
  },
  scroll: {
    paddingHorizontal: m.scrollPadH,
    paddingBottom: m.scrollPadBottom,
    gap: m.scrollGap,
    paddingTop: 12,
  },
  tabs: {flexDirection: 'row', gap: 8},
  tab: {
    paddingVertical: m.tabPadV,
    paddingHorizontal: m.tabPadH,
    borderRadius: 99,
  },
  tabText: {fontSize: m.tabFont, fontWeight: '700'},
  report: {padding: 14, borderRadius: m.inputRadius, gap: 6},
  reportTitle: {fontWeight: '700', marginBottom: 4},
  sub: {textAlign: 'center'},
  ctaText: {fontWeight: '700'},
  err: {textAlign: 'center'},
  reportLine: {fontSize: 13},
  reportClose: {fontWeight: '600', marginTop: 8},
});
