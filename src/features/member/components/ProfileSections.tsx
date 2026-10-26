/**
 * Sections Informations / Compte / Session du profil membre.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {
  User,
  Building2,
  Briefcase,
  Store,
  Globe,
  Phone,
  Mail,
  Calendar,
  ShieldCheck,
  Bot as BotIcon,
  Pencil,
} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import type {Member} from '../../../core/api/endpoints/auth';
import type {Bot} from '../../../core/api/endpoints/bots';
import {
  countryLabel,
  formatPhone,
  isShopUsage,
  memberSince,
  statusLabel,
  statusTone,
  usageLabel,
} from '../utils/format';
import {texts} from '../texts';
import {ProfileRow} from './ProfileRow';
import {ProfileSessionSection} from './ProfileSessionSection';

type Props = {
  member: Member;
  defaultBot: Bot | undefined;
  onEdit: () => void;
  onGoDashboard?: () => void;
  onLogout: () => void;
  onDelete: () => void;
};

export function ProfileSections({
  member,
  defaultBot,
  onEdit,
  onGoDashboard,
  onLogout,
  onDelete,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const tone = statusTone(member.status);
  const badgeBg =
    tone === 'good'
      ? colors.badgeGoodBg
      : tone === 'warn'
        ? colors.badgeWarnBg
        : colors.badgeBadBg;
  const badgeText =
    tone === 'good'
      ? colors.badgeGoodText
      : tone === 'warn'
        ? colors.badgeWarnText
        : colors.danger;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.bgPrimary,
      borderColor: colors.borderSoft,
    },
    getShadow('sm', mode),
  ];

  return (
    <>
      <View style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
            {texts.sectionInfo}
          </Text>
          <Pressable
            onPress={onEdit}
            style={[styles.editBtn, {backgroundColor: colors.accentSoft}]}>
            <Pencil size={14} color={colors.accent} />
            <Text style={[styles.editBtnText, {color: colors.accent}]}>
              {texts.edit}
            </Text>
          </Pressable>
        </View>
        <View style={cardStyle}>
          <ProfileRow
            icon={<User />}
            label={texts.labelName}
            value={member.display_name || texts.emptyValue}
          />
          <Divider />
          <ProfileRow
            icon={<Building2 />}
            label={texts.labelOrganization}
            value={member.organization || texts.emptyValue}
          />
          <Divider />
          <ProfileRow
            icon={isShopUsage(member.usage) ? <Store /> : <Briefcase />}
            label={texts.labelUsage}
            value={usageLabel(member.usage) || texts.emptyValue}
          />
          <Divider />
          <ProfileRow
            icon={<Globe />}
            label={texts.labelCountry}
            value={countryLabel(member.country) || texts.emptyValue}
          />
          <Divider />
          <ProfileRow
            icon={<Phone />}
            label={texts.labelPhone}
            value={formatPhone(member.phone) || texts.emptyValue}
          />
          <Divider />
          <ProfileRow
            icon={<Mail />}
            label={texts.labelEmail}
            value={
              <View style={styles.emailRow}>
                <Text style={[styles.emailText, {color: colors.textPrimary}]}>
                  {member.email}
                </Text>
                <View
                  style={[
                    styles.badge,
                    {
                      backgroundColor: member.email_verified
                        ? colors.badgeGoodBg
                        : colors.badgeWarnBg,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.badgeText,
                      {
                        color: member.email_verified
                          ? colors.badgeGoodText
                          : colors.badgeWarnText,
                      },
                    ]}>
                    {member.email_verified
                      ? texts.emailVerifiedBadge
                      : texts.emailNotVerified}
                  </Text>
                </View>
              </View>
            }
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text
          style={[
            styles.sectionTitle,
            styles.sectionTitleSolo,
            {color: colors.textHint},
          ]}>
          {texts.sectionAccount}
        </Text>
        <View style={cardStyle}>
          <ProfileRow
            icon={<Calendar />}
            label={texts.labelMemberSince}
            value={memberSince(member.created_at)}
          />
          <Divider />
          <ProfileRow
            icon={<ShieldCheck />}
            tone="good"
            label={texts.labelStatus}
            value={
              <View style={[styles.badge, {backgroundColor: badgeBg}]}>
                <Text style={[styles.badgeText, {color: badgeText}]}>
                  {statusLabel(member.status)}
                </Text>
              </View>
            }
          />
          <Divider />
          <ProfileRow
            icon={<BotIcon />}
            label={texts.labelDefaultBot}
            value={defaultBot ? `@${defaultBot.username}` : texts.noDefaultBot}
            onPress={onGoDashboard}
          />
        </View>
      </View>

      <ProfileSessionSection onLogout={onLogout} onDelete={onDelete} />
    </>
  );
}

function Divider(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.divider, {backgroundColor: colors.bgSecondary}]} />
  );
}

const styles = StyleSheet.create({
  section: {gap: m.sectionInnerGap},
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: m.sectionHeadPadH,
  },
  sectionTitle: {
    fontSize: m.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: m.sectionTitleLetter * m.sectionTitleSize,
    textTransform: 'uppercase',
  },
  sectionTitleSolo: {
    paddingHorizontal: m.sectionHeadPadH,
  },
  editBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.editBtnGap,
    paddingVertical: m.editBtnPadV,
    paddingHorizontal: m.editBtnPadH,
    borderRadius: 99,
  },
  editBtnText: {
    fontSize: m.editBtnFont,
    fontWeight: '700',
  },
  card: {
    borderRadius: m.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
  emailRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 8,
  },
  emailText: {
    fontSize: m.rowValSize,
    fontWeight: '600',
  },
  badge: {
    borderRadius: 99,
    paddingVertical: m.badgePadV,
    paddingHorizontal: m.badgePadH,
  },
  badgeText: {
    fontSize: m.badgeFont,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
});
