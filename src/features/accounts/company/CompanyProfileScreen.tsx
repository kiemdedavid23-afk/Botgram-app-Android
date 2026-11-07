import React, {useEffect, useState} from 'react';
import {ScrollView, View, Text, Pressable, StyleSheet} from 'react-native';
import {Avatar} from '../../../shared/components/Avatar';
import {GradientView} from '../../../shared/components/GradientView';
import {useAuthStore} from '../../auth/store/authStore';
import {useMemberStore} from '../../member/store/memberStore';
import {EditProfileSheet} from '../../member/components/EditProfileSheet';
import {DeleteAccountDialog} from '../../member/components/DeleteAccountDialog';
import {countryLabel, formatPhone, memberSince, usageLabel} from '../../member/utils/format';
import {useWorkspaceStore} from '../store/workspaceStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {Rise} from './components/Rise';
import {Card, CardTitle, Divider, KeyValue, OutlineButton} from './components/ui';

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

  if (!member) return <View style={[styles.root, {backgroundColor: t.bg}]} />;

  return (
    <View style={styles.root}>
      <GradientView colors={[t.bg, t.bgGlow]} angle={165} style={StyleSheet.absoluteFill} />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Rise index={0}>
          <View style={[styles.hero, {shadowColor: t.primary}]}>
            <GradientView colors={[t.primaryHi, t.primary]} angle={160} style={StyleSheet.absoluteFill} />
            <Avatar size={64} title={member.display_name} />
            <View style={styles.heroText}>
              <Text style={styles.heroName} numberOfLines={1}>
                {member.display_name}
              </Text>
              <Text style={styles.heroSub} numberOfLines={1}>
                {`Responsable${ws ? ` · ${ws.name}` : ''}`}
              </Text>
            </View>
          </View>
        </Rise>

        <Rise index={1}>
          <Card>
            <CardTitle title="Mes informations" />
            <View style={styles.rows}>
              <KeyValue label="E-mail" value={`${member.email}${member.email_verified ? ' ✓' : ''}`} />
              <Divider />
              <KeyValue label="Téléphone" value={formatPhone(member.phone)} />
              <Divider />
              <KeyValue label="Pays" value={countryLabel(member.country)} />
              <Divider />
              <KeyValue label="Usage" value={usageLabel(member.usage)} />
              <Divider />
              <KeyValue label="Membre depuis" value={memberSince(member.created_at)} />
            </View>
            <View style={styles.btn}>
              <OutlineButton label="Modifier mes informations" onPress={() => setEditing(true)} />
            </View>
          </Card>
        </Rise>

        {ws ? (
          <Rise index={2}>
            <Card>
              <CardTitle title="Entreprise" />
              <View style={styles.rows}>
                <KeyValue label="Nom" value={ws.name} />
                <Divider />
                <KeyValue label="Secteur" value={ws.sector ?? ''} />
                <Divider />
                <KeyValue label="Pays" value={countryLabel(ws.country)} />
                <Divider />
                <KeyValue label="Téléphone" value={formatPhone(ws.phone)} />
                <Divider />
                <KeyValue label="Créée le" value={memberSince(ws.created_at)} />
              </View>
            </Card>
          </Rise>
        ) : null}

        <Rise index={3}>
          <Card>
            <CardTitle title="Session" />
            <View style={styles.rows}>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  fireAndForget(signOut());
                }}
                style={styles.action}>
                <Text style={[styles.actionText, {color: t.ink}]}>Se déconnecter</Text>
              </Pressable>
              <Divider />
              <Pressable accessibilityRole="button" onPress={() => setDeleting(true)} style={styles.action}>
                <Text style={[styles.actionText, {color: t.bad}]}>Supprimer le compte</Text>
              </Pressable>
            </View>
          </Card>
        </Rise>
      </ScrollView>
      <EditProfileSheet visible={editing} onClose={() => setEditing(false)} />
      <DeleteAccountDialog visible={deleting} email={member.email} onClose={() => setDeleting(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {paddingHorizontal: cm.pageH, paddingTop: cm.pageTop, paddingBottom: cm.pageBottom, gap: cm.sectionGap},
  hero: {
    borderRadius: cm.cardRadius,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    padding: cm.cardPad,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 5,
  },
  heroText: {flex: 1},
  heroName: {fontFamily: companyFonts.display, fontSize: 24, fontWeight: '700', color: '#FFFFFF'},
  heroSub: {fontFamily: companyFonts.body, fontSize: 15, color: 'rgba(255,255,255,0.85)', marginTop: 2},
  rows: {marginTop: 8},
  btn: {marginTop: 12},
  action: {paddingVertical: 15},
  actionText: {fontFamily: companyFonts.value, fontSize: 17},
});
