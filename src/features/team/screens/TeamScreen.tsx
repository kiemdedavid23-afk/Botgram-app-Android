import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, ScrollView, Pressable, RefreshControl, StyleSheet} from 'react-native';
import {useAccess, useWorkspaceStore} from '../../accounts';
import {useAuthStore} from '../../auth';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {InviteRole, TeamMember} from '../../../core/api/endpoints/team';
import {useTeamStore} from '../store/teamStore';
import {
  expiryLabel,
  memberActions,
  pendingInvites,
  roleName,
  seatsLeft,
  sortMembers,
  TEAM_MAX,
} from '../utils/teamLogic';
import {useTeamPalette} from '../components/teamPalette';
import {Button, ConfirmBox} from '../components/Sheet';
import {InviteSheet} from '../components/InviteSheet';
import {MemberSheet} from '../components/MemberSheet';
import {EditCompanySheet} from '../components/EditCompanySheet';

type Confirm = {kind: 'remove' | 'transfer'; member: TeamMember} | {kind: 'revoke'; id: string; email: string};

export function TeamScreen(): React.JSX.Element {
  const p = useTeamPalette();
  const access = useAccess();
  const selfId = useAuthStore(s => s.member?.id ?? null);
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const {members, invites, loaded, offline, busy} = useTeamStore();
  const load = useTeamStore(s => s.load);
  const changeRole = useTeamStore(s => s.changeRole);
  const remove = useTeamStore(s => s.remove);
  const transfer = useTeamStore(s => s.transfer);
  const revoke = useTeamStore(s => s.revoke);
  const isOwner = access.canManageTeam;
  const wsId = ws?.id ?? null;

  const [refreshing, setRefreshing] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (wsId) fireAndForget(load(wsId, {withInvites: isOwner}));
  }, [wsId, isOwner, load]);

  // Une personne rejoint ou part : le compteur de l'espace change, la liste suit.
  const count = ws?.members_count ?? members.length;
  useEffect(() => {
    if (wsId) fireAndForget(load(wsId, {force: true, withInvites: isOwner}));
  }, [count, wsId, isOwner, load]);

  const onRefresh = useCallback(async () => {
    if (!wsId) return;
    setRefreshing(true);
    await load(wsId, {force: true, withInvites: isOwner});
    setRefreshing(false);
  }, [wsId, isOwner, load]);

  const now = Date.now();
  const pending = useMemo(() => pendingInvites(invites, now), [invites, now]);
  const sorted = useMemo(() => sortMembers(members), [members]);
  const seats = seatsLeft(members.length, pending.length);

  if (!ws) {
    return (
      <View style={[styles.root, {backgroundColor: p.bg}]}>
        <Text style={[styles.empty, {color: p.inkSoft}]}>Chargement de l’équipe…</Text>
      </View>
    );
  }

  const onRole = async (role: InviteRole) => {
    if (!selected) return;
    setSheetError(null);
    const res = await changeRole(ws.id, selected.member_id, role);
    if (res.ok) {
      setSelected(null);
      setNotice('Rôle mis à jour.');
    } else setSheetError(res.message);
  };

  const onConfirm = async () => {
    if (!confirm) return;
    const c = confirm;
    setConfirm(null);
    if (c.kind === 'revoke') {
      const res = await revoke(ws.id, c.id);
      setNotice(res.ok ? 'Invitation révoquée.' : res.message);
      return;
    }
    if (c.kind === 'remove') {
      const res = await remove(ws.id, c.member.member_id);
      setSelected(null);
      if (!res.ok) setNotice(res.message);
      else {
        setNotice(
          res.data.accountDeleted
            ? 'Personne retirée ; son compte a été supprimé.'
            : 'Personne retirée.',
        );
      }
      return;
    }
    const res = await transfer(ws.id, c.member.member_id);
    setSelected(null);
    setNotice(res.ok ? 'Propriété transférée.' : res.message);
  };

  const confirmText = (): {title: string; body: string; label: string; danger: boolean} => {
    if (!confirm) return {title: '', body: '', label: '', danger: false};
    if (confirm.kind === 'revoke') {
      return {title: 'Révoquer l’invitation ?', body: `Le code envoyé à ${confirm.email} ne fonctionnera plus.`, label: 'Révoquer', danger: true};
    }
    const name = confirm.member.display_name;
    if (confirm.kind === 'remove') {
      return {
        title: `Retirer ${name} ?`,
        body: 'Son accès est coupé immédiatement. Son compte invité sera supprimé ; ses messages restent, sans auteur.',
        label: 'Retirer',
        danger: true,
      };
    }
    return {
      title: `Transférer la propriété à ${name} ?`,
      body: `${name} devient propriétaire et reçoit tous les bots. Vous devenez invité avec le rôle Agent : vous ne pourrez plus lier de bot ni gérer l’équipe, et si vous quittez ensuite l’entreprise, votre compte sera supprimé.`,
      label: 'Transférer',
      danger: true,
    };
  };
  const ct = confirmText();

  return (
    <View style={[styles.root, {backgroundColor: p.bg}]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={p.accent} onRefresh={() => fireAndForget(onRefresh())} />}>
        <View style={styles.head}>
          <Text style={[styles.title, {color: p.ink, fontFamily: p.titleFont}]}>Équipe</Text>
          <Text style={{color: p.inkSoft, fontSize: 13}}>{`${ws.members_count} / ${TEAM_MAX} personnes`}</Text>
        </View>
        {offline ? <Text style={{color: p.inkSoft, fontSize: 12}}>Hors ligne : liste peut-être périmée.</Text> : null}
        {notice ? (
          <Pressable onPress={() => setNotice(null)} style={[styles.notice, {backgroundColor: p.accentSoft, borderRadius: p.radius}]}>
            <Text style={{color: p.ink, fontSize: 13}}>{notice}</Text>
          </Pressable>
        ) : null}

        {isOwner ? (
          <View style={styles.actions}>
            <Button p={p} label="Inviter" onPress={() => setInviting(true)} disabled={!!busy} />
            <Button p={p} kind="ghost" label="Modifier l’entreprise" onPress={() => setEditing(true)} disabled={!!busy} />
          </View>
        ) : null}

        <Text style={[styles.section, {color: p.inkSoft, fontFamily: p.labelFont}]}>PERSONNES</Text>
        <View style={[styles.card, {backgroundColor: p.surface, borderColor: p.line, borderRadius: p.radius}]}>
          {sorted.length === 0 && !loaded ? <Text style={[styles.empty, {color: p.inkSoft}]}>Chargement…</Text> : null}
          {sorted.map((m, i) => {
            const act = memberActions(isOwner, m, selfId);
            const manageable = act.canChangeRole || act.canRemove || act.canTransfer;
            return (
              <Pressable
                key={m.member_id}
                disabled={!manageable}
                onPress={() => {
                  setSheetError(null);
                  setSelected(m);
                }}
                style={[styles.row, i > 0 && {borderTopColor: p.line, borderTopWidth: StyleSheet.hairlineWidth}]}>
                <View style={[styles.avatar, {backgroundColor: p.accent, borderRadius: p.radius}]}>
                  <Text style={{color: p.onAccent, fontWeight: '700'}}>{(m.display_name.trim()[0] ?? '·').toUpperCase()}</Text>
                </View>
                <View style={styles.flex}>
                  <Text style={{color: p.ink, fontSize: 15, fontWeight: '600'}} numberOfLines={1}>
                    {m.display_name}{m.member_id === selfId ? ' (vous)' : ''}
                  </Text>
                  <Text style={{color: p.inkSoft, fontSize: 12.5}}>{roleName(m.role)}</Text>
                </View>
                {manageable ? <Text style={{color: p.accent, fontSize: 13, fontWeight: '700'}}>Gérer</Text> : null}
              </Pressable>
            );
          })}
        </View>

        {isOwner ? (
          <>
            <Text style={[styles.section, {color: p.inkSoft, fontFamily: p.labelFont}]}>{`INVITATIONS EN ATTENTE (${pending.length})`}</Text>
            <View style={[styles.card, {backgroundColor: p.surface, borderColor: p.line, borderRadius: p.radius}]}>
              {pending.length === 0 ? <Text style={[styles.empty, {color: p.inkSoft}]}>Aucune invitation en attente.</Text> : null}
              {pending.map((i, k) => (
                <View key={i.id} style={[styles.row, k > 0 && {borderTopColor: p.line, borderTopWidth: StyleSheet.hairlineWidth}]}>
                  <View style={styles.flex}>
                    <Text style={{color: p.ink, fontSize: 14.5, fontWeight: '600'}} numberOfLines={1}>{i.email}</Text>
                    <Text style={{color: p.inkSoft, fontSize: 12.5}}>{`${roleName(i.role)} · ${expiryLabel(i.expires_at, now)}`}</Text>
                  </View>
                  <Pressable disabled={!!busy} onPress={() => setConfirm({kind: 'revoke', id: i.id, email: i.email})}>
                    <Text style={{color: p.danger, fontSize: 13, fontWeight: '700'}}>Révoquer</Text>
                  </Pressable>
                </View>
              ))}
            </View>
          </>
        ) : (
          <Text style={{color: p.inkSoft, fontSize: 13, lineHeight: 19}}>
            Seul le propriétaire invite, change les rôles et retire des personnes.
          </Text>
        )}
      </ScrollView>

      {isOwner ? (
        <>
          <InviteSheet visible={inviting} workspaceId={ws.id} companyName={ws.name} seats={seats} pending={pending} onClose={() => setInviting(false)} />
          <EditCompanySheet visible={editing} workspace={ws} onClose={() => setEditing(false)} />
          <MemberSheet
            member={selected && !confirm ? selected : null}
            busy={!!busy}
            error={sheetError}
            onClose={() => setSelected(null)}
            onRole={r => fireAndForget(onRole(r))}
            onTransfer={() => selected && setConfirm({kind: 'transfer', member: selected})}
            onRemove={() => selected && setConfirm({kind: 'remove', member: selected})}
          />
          <ConfirmBox
            visible={confirm !== null}
            title={ct.title}
            body={ct.body}
            confirmLabel={ct.label}
            danger={ct.danger}
            busy={!!busy}
            onCancel={() => setConfirm(null)}
            onConfirm={() => fireAndForget(onConfirm())}
          />
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  flex: {flex: 1},
  content: {padding: 16, paddingBottom: 40, gap: 12},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  title: {fontSize: 24, fontWeight: '700'},
  actions: {flexDirection: 'row', gap: 10},
  section: {fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 6},
  card: {borderWidth: 1, overflow: 'hidden'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  avatar: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  empty: {padding: 16, fontSize: 13},
  notice: {padding: 12},
});
