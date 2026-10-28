/**
 * Hub Paramètres — en-tête unique « Paramètres », puis cartes de réglages.
 */
import React from 'react';
import {View, Text, ScrollView, StyleSheet, Pressable} from 'react-native';
import {Palette, MessageSquare, Globe, Shield, BookOpen} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm, fontWeight} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {SettingsHubRow} from '../components/SettingsHubRow';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, RowDivider} from '../components/ui';
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
  const {colors, appearance} = useTheme();
  const member = useAuthStore(s => s.member);
  const displayName = member?.display_name?.trim() || t.you;
  const lang = languageLabel(appearance.uiLanguage);
  const icon = (Icon: typeof Palette) => (
    <Icon size={sm.iconInner} color={colors.white} />
  );

  return (
    <SettingsPage title={t.pageTitle}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <SettingsCard>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.account}
            onPress={() => onNavigate('account')}
            android_ripple={{color: colors.accentSoft}}
            style={styles.youRow}>
            <View style={styles.youLabels}>
              <Text style={[styles.youTitle, {color: colors.textPrimary}]}>
                {displayName}
              </Text>
              <Text style={[styles.youSub, {color: colors.textSecondary}]}>
                {t.you}
              </Text>
            </View>
            <Text style={[styles.accountLink, {color: colors.accent}]}>
              {t.account}
            </Text>
          </Pressable>
        </SettingsCard>

        <SettingsCard>
          <CardTitle>{t.sectionPreferences}</CardTitle>
          <SettingsHubRow
            icon={icon(Palette)}
            iconBg="#2AABEE"
            title={t.appearance}
            subtitle={t.appearanceSub}
            onPress={() => onNavigate('appearance')}
          />
          <Divider />
          <SettingsHubRow
            icon={icon(MessageSquare)}
            iconBg="#F5A623"
            title={t.discussions}
            subtitle={t.discussionsSub}
            onPress={() => onNavigate('discussions')}
          />
          <Divider />
          <SettingsHubRow
            icon={icon(Globe)}
            iconBg="#8E44AD"
            title={t.language}
            subtitle={lang}
            onPress={() => onNavigate('language')}
          />
          <Divider />
          <SettingsHubRow
            icon={icon(Shield)}
            iconBg="#E74C3C"
            title={t.permissions}
            subtitle={t.permissionsSub}
            onPress={() => onNavigate('permissions')}
          />
        </SettingsCard>

        <SettingsCard>
          <CardTitle>{t.sectionHelp}</CardTitle>
          <SettingsHubRow
            icon={icon(BookOpen)}
            iconBg="#5B6CFF"
            title={t.documentation}
            subtitle={t.documentationSub}
            onPress={() => onNavigate('documentation')}
          />
        </SettingsCard>
      </ScrollView>
    </SettingsPage>
  );
}

/** Séparateur aligné sur le texte (après l'icône). */
function Divider(): React.JSX.Element {
  return (
    <View style={styles.dividerWrap}>
      <RowDivider />
    </View>
  );
}

const styles = StyleSheet.create({
  content: {paddingTop: 12, paddingBottom: 24, gap: 12},
  youRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
  },
  youLabels: {flex: 1, gap: 2},
  youTitle: {fontSize: 18, fontWeight: fontWeight.semibold},
  youSub: {fontSize: sm.subSize},
  accountLink: {fontSize: 16, fontWeight: fontWeight.semibold},
  dividerWrap: {marginLeft: sm.rowPadH + sm.iconSize + sm.rowGap - 68},
});
