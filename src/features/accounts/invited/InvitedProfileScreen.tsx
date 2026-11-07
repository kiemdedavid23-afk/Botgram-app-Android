import React, {useEffect, useState} from 'react';
import {View, ScrollView, Text, StyleSheet} from 'react-native';
import {Building2, User, ShieldCheck, Mail, Globe} from 'lucide-react-native';
import {useTheme, memberProfileMetrics as m, getShadow} from '../../../shared/theme';
import {useAuthStore} from '../../auth/store/authStore';
import {useMemberStore} from '../../member/store/memberStore';
import {ProfileHero} from '../../member/components/ProfileHero';
import {ProfileRow} from '../../member/components/ProfileRow';
import {ProfileSessionSection} from '../../member/components/ProfileSessionSection';
import {EditProfileSheet} from '../../member/components/EditProfileSheet';
import {DeleteAccountDialog} from '../../member/components/DeleteAccountDialog';
import {countryLabel} from '../../member/utils/format';
import {useWorkspaceStore} from '../store/workspaceStore';
import {useAccess} from '../useAccess';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {inviteRoleLabel} from './invitedLogic';
import {LeaveCompanySection} from './LeaveCompanySection';

export function InvitedProfileScreen(): React.JSX.Element {
  const {colors, mode} = useTheme();
  const authMember = useAuthStore(s => s.member);
  const signOut = useAuthStore(s => s.signOut);
  const setMember = useMemberStore(s => s.setMember);
  const member = useMemberStore(s => s.member) ?? authMember;
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const access = useAccess();
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authMember) setMember(authMember);
  }, [authMember, setMember]);

  if (!member) return <View style={{flex: 1, backgroundColor: colors.bgSecondary}} />;

  const card = [
    styles.card,
    {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft},
    getShadow('sm', mode),
  ];

  return (
    <View style={{flex: 1, backgroundColor: colors.bgSecondary}}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <ProfileHero
          displayName={member.display_name}
          status={member.status}
          emailVerified={member.email_verified}
          organization={ws?.name ?? null}
          role={null}
        />
        <View style={styles.block}>
          <Text style={[styles.title, {color: colors.textHint}]}>MON ACCÈS</Text>
          <View style={card}>
            <ProfileRow icon={<Building2 />} label="Entreprise" value={ws?.name ?? '—'} />
            <ProfileRow icon={<ShieldCheck />} label="Mon rôle" value={inviteRoleLabel(access.role)} />
            <ProfileRow icon={<User />} label="Responsable" value={ws?.owner.display_name ?? '—'} />
          </View>
        </View>
        <View style={styles.block}>
          <Text style={[styles.title, {color: colors.textHint}]}>MES INFORMATIONS</Text>
          <View style={card}>
            <ProfileRow icon={<User />} label="Nom" value={member.display_name} onPress={() => setEditing(true)} />
            <ProfileRow icon={<Mail />} label="E-mail" value={member.email} />
            <ProfileRow icon={<Globe />} label="Pays" value={countryLabel(member.country)} />
          </View>
        </View>
        <LeaveCompanySection />
        <ProfileSessionSection
          onLogout={() => {
            fireAndForget(signOut());
          }}
          onDelete={() => setDeleting(true)}
        />
      </ScrollView>
      <EditProfileSheet visible={editing} onClose={() => setEditing(false)} />
      <DeleteAccountDialog visible={deleting} email={member.email} onClose={() => setDeleting(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: m.scrollPadH,
    paddingTop: m.scrollPadTop,
    paddingBottom: m.scrollPadBottom,
    gap: m.sectionGap,
  },
  block: {gap: 8},
  title: {fontSize: m.sectionTitleSize, fontWeight: '700', letterSpacing: 1},
  card: {borderRadius: m.cardRadius, borderWidth: 1, overflow: 'hidden'},
});
