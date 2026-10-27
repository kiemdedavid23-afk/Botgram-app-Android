/**
 * Hub Paramètres — espace bot (maquette).
 */
import React from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable} from 'react-native';
import {
  Palette,
  MessageSquare,
  Globe,
  Shield,
  BookOpen,
} from 'lucide-react-native';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
  fontWeight,
  fontSize,
} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {SettingsHubRow} from '../components/SettingsHubRow';
import {settingsTexts as t} from '../texts';
import {languageLabel} from '../languages';

export type SettingsRoute =
  | 'hub'
  | 'appearance'
  | 'discussions'
  | 'folders'
  | 'language'
  | 'permissions'
  | 'account'
  | 'documentation';

type Props = {
  onNavigate: (route: SettingsRoute) => void;
};

export function BotSettingsHubScreen({onNavigate}: Props): React.JSX.Element {
  const {colors, mode, appearance} = useTheme();
  const member = useAuthStore(s => s.member);
  const displayName = member?.display_name?.trim() || t.you;
  const lang = languageLabel(appearance.uiLanguage);

  const cardStyle = [
    styles.card,
    {backgroundColor: colors.bgPrimary},
    getShadow('sm', mode),
  ];

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}>
      <Text style={[styles.pageTitle, {color: colors.textPrimary}]}>
        {t.pageTitle}
      </Text>

      <View style={cardStyle}>
        <Pressable
          onPress={() => onNavigate('account')}
          style={({pressed}) => [
            styles.youRow,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <View style={styles.youLabels}>
            <Text style={[styles.youTitle, {color: colors.textPrimary}]}>
              {t.you}
            </Text>
            <Text style={[styles.youSub, {color: colors.textSecondary}]}>
              {displayName}
            </Text>
          </View>
          <Text style={[styles.accountLink, {color: colors.accent}]}>
            {t.account} {'>'}
          </Text>
        </Pressable>
      </View>

      <Text style={[styles.section, {color: colors.textHint}]}>
        {t.sectionPreferences}
      </Text>
      <View style={cardStyle}>
        <SettingsHubRow
          icon={<Palette size={sm.iconInner} color={colors.white} />}
          iconBg="#2AABEE"
          title={t.appearance}
          subtitle={t.appearanceSub}
          onPress={() => onNavigate('appearance')}
        />
        <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
        <SettingsHubRow
          icon={<MessageSquare size={sm.iconInner} color={colors.white} />}
          iconBg="#F5A623"
          title={t.discussions}
          subtitle={t.discussionsSub}
          onPress={() => onNavigate('discussions')}
        />
        <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
        <SettingsHubRow
          icon={<Globe size={sm.iconInner} color={colors.white} />}
          iconBg="#8E44AD"
          title={t.language}
          subtitle={lang}
          onPress={() => onNavigate('language')}
        />
        <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
        <SettingsHubRow
          icon={<Shield size={sm.iconInner} color={colors.white} />}
          iconBg="#E74C3C"
          title={t.permissions}
          subtitle={t.permissionsSub}
          onPress={() => onNavigate('permissions')}
        />
      </View>

      <Text style={[styles.section, {color: colors.textHint}]}>
        {t.sectionHelp}
      </Text>
      <View style={cardStyle}>
        <SettingsHubRow
          icon={<BookOpen size={sm.iconInner} color={colors.white} />}
          iconBg="#5B6CFF"
          title={t.documentation}
          subtitle={t.documentationSub}
          onPress={() => onNavigate('documentation')}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {
    paddingTop: 8,
    paddingBottom: sm.scrollPadBottom + 24,
  },
  pageTitle: {
    fontSize: fontSize.pageHeader,
    fontWeight: fontWeight.bold,
    marginHorizontal: sm.cardMarginH,
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  card: {
    marginHorizontal: sm.cardMarginH,
    marginBottom: sm.cardMarginBottom,
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
  },
  youRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: sm.rowPadH,
    gap: 12,
  },
  youLabels: {flex: 1, gap: 2},
  youTitle: {fontSize: 17, fontWeight: fontWeight.semibold},
  youSub: {fontSize: sm.subSize},
  accountLink: {fontSize: 15, fontWeight: fontWeight.semibold},
  section: {
    marginHorizontal: sm.cardMarginH,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  sep: {
    height: 1,
    marginLeft: sm.rowPadH + sm.iconSize + sm.rowGap,
  },
});
