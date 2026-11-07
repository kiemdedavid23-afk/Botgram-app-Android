import React, {useEffect, useState} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet} from 'react-native';
import {useAuthStore} from '../../auth/store/authStore';
import {useMemberStore} from '../../member/store/memberStore';
import {EditProfileSheet} from '../../member/components/EditProfileSheet';
import {DeleteAccountDialog} from '../../member/components/DeleteAccountDialog';
import {countryLabel, formatPhone, memberSince, usageLabel} from '../../member/utils/format';
import {useWorkspaceStore} from '../store/workspaceStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {monogram} from './companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {Rise} from './components/Rise';
import {KeyValue, Panel, SectionLabel} from './components/Primitives';

export function CompanyProfileScreen(): React.JSX.Element {
  const t = useCompanyTheme();
  const authMember = useAuthStore(s => s.member);
  const signOut = useAuthStore(s => s.signOut);
  const setMember = useMemberStore(s => s.setMember);
  const member = useMemberStore(s => s.member) ?? authMember;
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authMember) setMember(authMember);
  }, [authMember, setMember]);

  if (!member) return <View style={{flex: 1, backgroundColor: t.bg}} />;

  return (
    <View style={{flex: 1, backgroundColor: t.bg}}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Rise index={0}>
          <View style={[styles.card, {backgroundColor: t.navy}]}>
            <View style={[styles.mono, {borderColor: t.gold}]}>
              <Text style={[styles.monoText, {color: t.gold}]}>{monogram(member.display_name)}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={[styles.name, {color: t.onNavy}]} numberOfLines={1}>
                {member.display_name}
              </Text>
              <Text style={[styles.sub, {color: t.gold}]}>Responsable de l’entreprise</Text>
            </View>
          </View>
        </Rise>

        <Rise index={1}>
          <SectionLabel>Responsable</SectionLabel>
          <Panel>
            <KeyValue label="E-mail" value={`${member.email}${member.email_verified ? ' ✓' : ''}`} />
            <KeyValue label="Téléphone" value={formatPhone(member.phone)} />
            <KeyValue label="Pays" value={countryLabel(member.country)} />
            <KeyValue label="Usage" value={usageLabel(member.usage)} />
            <KeyValue label="Membre depuis" value={memberSince(member.created_at)} last />
          </Panel>
          <Pressable
            accessibilityRole="button"
            onPress={() => setEditing(true)}
            style={[styles.btn, {borderColor: t.navy}]}>
            <Text style={[styles.btnText, {color: t.navy}]}>Modifier mes informations</Text>
          </Pressable>
        </Rise>

        {ws ? (
          <Rise index={2}>
            <SectionLabel>Entreprise</SectionLabel>
            <Panel rail>
              <KeyValue label="Nom" value={ws.name} />
              <KeyValue label="Secteur" value={ws.sector ?? ''} />
              <KeyValue label="Pays" value={countryLabel(ws.country)} />
              <KeyValue label="Téléphone" value={formatPhone(ws.phone)} last />
            </Panel>
          </Rise>
        ) : null}

        <Rise index={3}>
          <SectionLabel>Session</SectionLabel>
          <Panel>
            <Pressable
              accessibilityRole="button"
              onPress={() => {
                fireAndForget(signOut());
              }}
              style={[styles.action, {borderBottomColor: t.line}]}>
              <Text style={[styles.actionText, {color: t.ink}]}>Se déconnecter</Text>
            </Pressable>
            <Pressable accessibilityRole="button" onPress={() => setDeleting(true)} style={styles.action}>
              <Text style={[styles.actionText, {color: t.bad}]}>Supprimer le compte</Text>
            </Pressable>
          </Panel>
        </Rise>
      </ScrollView>
      <EditProfileSheet visible={editing} onClose={() => setEditing(false)} />
      <DeleteAccountDialog visible={deleting} email={member.email} onClose={() => setDeleting(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  content: {paddingHorizontal: cm.pageH, paddingTop: cm.pageTop, paddingBottom: cm.pageBottom, gap: cm.sectionGap},
  card: {flexDirection: 'row', alignItems: 'center', gap: 14, padding: 16, borderRadius: cm.radius},
  mono: {width: 52, height: 52, borderWidth: 1.5, borderRadius: cm.radius, alignItems: 'center', justifyContent: 'center'},
  monoText: {fontFamily: companyFonts.display, fontSize: 20, fontWeight: '700'},
  name: {fontFamily: companyFonts.display, fontSize: 20, fontWeight: '700'},
  sub: {fontFamily: companyFonts.label, fontSize: 11, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '700', marginTop: 2},
  btn: {marginTop: 10, borderWidth: 1, borderRadius: cm.radius, paddingVertical: 12, alignItems: 'center'},
  btnText: {fontFamily: companyFonts.label, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  action: {paddingHorizontal: 14, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: 'transparent'},
  actionText: {fontFamily: companyFonts.value, fontSize: 15},
});
