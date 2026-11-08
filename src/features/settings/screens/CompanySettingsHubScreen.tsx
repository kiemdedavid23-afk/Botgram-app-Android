/**
 * Hub Paramètres — habillage entreprise (même style que le tableau de bord).
 * Une carte profil en haut, puis trois groupes : Mon espace, Sécurité et données, Aide.
 */
import React from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {
  Palette,
  MessageSquare,
  Globe,
  Shield,
  HardDrive,
  BookOpen,
  type LucideIcon,
} from 'lucide-react-native';
import {Avatar} from '../../../shared/components/Avatar';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {useWorkspaceStore} from '../../accounts/store/workspaceStore';
import {roleTag} from '../../accounts/company/companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';
import {Card, CardTitle, Divider, ArrowButton} from '../../accounts/company/components/ui';
import {Rise} from '../../accounts/company/components/Rise';
import {CompanyHubRow} from '../components/CompanyHubRow';
import {SettingsPage} from '../components/SettingsPage';
import {settingsTexts as tx} from '../texts';
import {settingsStorageTexts as st} from '../storageTexts';
import {languageLabel} from '../languages';
import type {SettingsRoute} from './BotSettingsHubScreen';
import {COMPANY_HUB_GROUPS} from './companyHubGroups';

type Props = {
  onNavigate: (route: SettingsRoute) => void;
};

export function CompanySettingsHubScreen({onNavigate}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const {appearance} = useTheme();
  const member = useAuthStore(s => s.member);
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const name = member?.display_name?.trim() || tx.you;
  const sub = ws ? `${roleTag(ws.role)} · ${ws.name}` : tx.you;

  const rows: Partial<Record<SettingsRoute, {Icon: LucideIcon; title: string; subtitle: string}>> = {
    appearance: {Icon: Palette, title: tx.appearance, subtitle: tx.appearanceSub},
    discussions: {Icon: MessageSquare, title: tx.discussions, subtitle: tx.discussionsSub},
    language: {Icon: Globe, title: tx.language, subtitle: languageLabel(appearance.uiLanguage)},
    permissions: {Icon: Shield, title: tx.permissions, subtitle: tx.permissionsSub},
    storage: {Icon: HardDrive, title: st.title, subtitle: st.hubSubtitle},
    documentation: {Icon: BookOpen, title: tx.documentation, subtitle: tx.documentationSub},
  };

  return (
    <SettingsPage title={tx.pageTitle}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Rise index={0}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`${tx.account} : ${name}`}
            onPress={() => onNavigate('account')}
            style={[styles.hero, {shadowColor: t.heroLo}]}>
            <GradientView colors={[t.heroHi, t.heroLo]} angle={160} style={StyleSheet.absoluteFill} />
            <Avatar size={56} title={name} />
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={1}>
                {name}
              </Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {sub}
              </Text>
            </View>
            <ArrowButton onPress={() => onNavigate('account')} label={tx.account} onColor />
          </Pressable>
        </Rise>
        {COMPANY_HUB_GROUPS.map((group, gi) => (
          <Rise key={group.id} index={gi + 1}>
            <Card>
              <CardTitle title={group.title} />
              <View style={styles.rows}>
                {group.routes.map((route, i) => {
                  const row = rows[route];
                  if (!row) return null;
                  return (
                    <React.Fragment key={route}>
                      {i > 0 ? <Divider /> : null}
                      <CompanyHubRow
                        Icon={row.Icon}
                        title={row.title}
                        subtitle={row.subtitle}
                        onPress={() => onNavigate(route)}
                      />
                    </React.Fragment>
                  );
                })}
              </View>
            </Card>
          </Rise>
        ))}
      </ScrollView>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  content: {paddingHorizontal: cm.pageH, paddingTop: cm.pageTop, paddingBottom: cm.pageBottom, gap: cm.sectionGap},
  hero: {
    borderRadius: cm.cardRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: cm.cardPad,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 5,
  },
  heroText: {flex: 1},
  heroName: {fontFamily: companyFonts.display, fontSize: cm.nameSize, fontWeight: '700', color: '#FFFFFF'},
  heroSub: {fontFamily: companyFonts.body, fontSize: cm.subSize, color: '#FFFFFF', marginTop: 2},
  rows: {marginTop: 6},
});
