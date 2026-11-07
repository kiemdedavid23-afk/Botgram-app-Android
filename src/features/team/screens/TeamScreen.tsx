import React, {useCallback, useEffect, useMemo, useState} from 'react';
import {View, Text, ScrollView, Pressable, RefreshControl, StyleSheet} from 'react-native';
import {Mail} from 'lucide-react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {Rise} from '../../accounts/company/components/Rise';
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
import {cardStyle, useTeamPalette, type TeamPalette} from '../components/teamPalette';
import {Button, ConfirmBox} from '../components/Sheet';
import {InviteSheet} from '../components/InviteSheet';
import {MemberSheet} from '../components/MemberSheet';
import {EditCompanySheet} from '../components/EditCompanySheet';

type Confirm = {kind: 'remove' | 'transfer'; member: TeamMember} | {kind: 'revoke'; id: string; email: string};

/** Titre de section : phrase en grand pour l'entreprise, capitales discrètes pour l'invité. */
function SectionTitle({p, text}: {p: TeamPalette; text: string}): React.JSX.Element {
  if (p.company) {
    return <Text style={[styles.cTitle, {color: p.ink, fontFamily: p.titleFont}]}>{text}</Text>;
  }
  return <Text style={[styles.section, {color: p.inkSoft, fontFamily: p.labelFont}]}>{text.toUpperCase()}</Text>;
}

/** Lettre sur tuile blanche (entreprise, comme les bots du tableau de bord) ou carré uni (invité). */
function MemberAvatar({p, name}: {p: TeamPalette; name: string}): React.JSX.Element {
  const letter = (name.trim()[0] ?? '·').toUpperCase();
  if (!p.company) {
    return (
      <View style={[styles.avatar, {backgroundColor: p.accent, borderRadius: p.radius}]}>
        <Text style={{color: p.onAccent, fontWeight: '700'}}>{letter}</Text>
      </View>
    );
  }
  return (
    <View style={[styles.tile, {backgroundColor: p.tile}]}>
      <View style={[styles.tileLetter, {backgroundColor: p.accent}]}>
        <Text style={{color: p.onAccent, fontWeight: '700', fontSize: 17, fontFamily: p.titleFont}}>{letter}</Text>
      </View>
    </View>
  );
}

function MailTile({p}: {p: TeamPalette}): React.JSX.Element | null {
  if (!p.company) return null;
  return (
    <View style={[styles.tile, {backgroundColor: p.tile}]}>
      <Mail size={22} color={p.accent} />
    </View>
  );
}

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

  const rowPad = p.company ? styles.rowC : null;
  const divider = {borderTopColor: p.line, borderTopWidth: StyleSheet.hairlineWidth};

  return (
    <View style={[styles.root, {backgroundColor: p.bg}]}>
      {p.company ? <GradientView colors={[p.bg, p.bgGlow]} angle={165} style={StyleSheet.absoluteFill} /> : null}
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} tintColor={p.accent} onRefresh={() => fireAndForget(onRefresh())} />}>
        <Rise index={0}>
          <View style={styles.group}>
            <View style={styles.head}>
              <Text style={[styles.title, {color: p.ink, fontFamily: p.titleFont, fontSize: p.company ? 26 : 24}]}>Équipe</Text>
              <Text style={{color: p.inkSoft, fontSize: p.company ? 14 : 13}}>{`${ws.members_count} / ${TEAM_MAX} personnes`}</Text>
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
          </View>
        </Rise>

        <Rise index={1}>
          <View style={styles.group}>
            <SectionTitle p={p} text="Personnes" />
            <View style={cardStyle(p)}>
              {sorted.length === 0 && !loaded ? <Text style={[styles.empty, {color: p.inkSoft}]}>Chargement…</Text> : null}
              {sorted.map((m, i) => {
                const act = memberActions(isOwner, m, selfId);
                const manageable = act.canChangeRole || act.canRemove || act.canTransfer;
                return (
                  <Pressable
                    key={m.member_id}
                    accessibilityRole={manageable ? 'button' : undefined}
                    accessibilityLabel={manageable ? `Gérer ${m.display_name}` : undefined}
                    disabled={!manageable}
                    onPress={() => {
                      setSheetError(null);
                      setSelected(m);
                    }}
                    style={[styles.row, rowPad, i > 0 && divider]}>
                    <MemberAvatar p={p} name={m.display_name} />
                    <View style={styles.flex}>
                      <Text style={{color: p.ink, fontSize: p.company ? 17 : 15, fontWeight: '600', fontFamily: p.titleFont}} numberOfLines={1}>
                        {m.display_name}{m.member_id === selfId ? ' (vous)' : ''}
                      </Text>
                      <Text style={{color: p.inkSoft, fontSize: p.company ? 14 : 12.5}}>{roleName(m.role)}</Text>
                    </View>
                    {manageable ? (
                      p.company ? (
                        <View style={[styles.pill, {backgroundColor: p.accentSoft}]}>
                          <Text style={{color: p.accent, fontSize: 13, fontWeight: '700'}}>Gérer</Text>
                        </View>
                      ) : (
                        <Text style={{color: p.accent, fontSize: 13, fontWeight: '700'}}>Gérer</Text>
                      )
                    ) : null}
                  </Pressable>
                );
              })}
            </View>
          </View>
        </Rise>

        {isOwner ? (
          <Rise index={2}>
            <View style={styles.group}>
              <SectionTitle p={p} text={`Invitations en attente (${pending.length})`} />
              <View style={cardStyle(p)}>
                {pending.length === 0 ? <Text style={[styles.empty, {color: p.inkSoft}]}>Aucune invitation en attente.</Text> : null}
                {pending.map((i, k) => (
                  <View key={i.id} style={[styles.row, rowPad, k > 0 && divider]}>
                    <MailTile p={p} />
                    <View style={styles.flex}>
                      <Text style={{color: p.ink, fontSize: p.company ? 16 : 14.5, fontWeight: '600'}} numberOfLines={1}>{i.email}</Text>
                      <Text style={{color: p.inkSoft, fontSize: p.company ? 14 : 12.5}}>{`${roleName(i.role)} · ${expiryLabel(i.expires_at, now)}`}</Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Révoquer l’invitation de ${i.email}`}
                      disabled={!!busy}
                      onPress={() => setConfirm({kind: 'revoke', id: i.id, email: i.email})}>
                      <Text style={{color: p.danger, fontSize: 13, fontWeight: '700'}}>Révoquer</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
            </View>
          </Rise>
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
  content: {paddingHorizontal: 16, paddingTop: 4, paddingBottom: 40, gap: 16},
  group: {gap: 12},
  head: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline'},
  title: {fontWeight: '700'},
  actions: {flexDirection: 'row', gap: 10},
  section: {fontSize: 11, fontWeight: '700', letterSpacing: 1.4, marginTop: 6},
  cTitle: {fontSize: 22, fontWeight: '700', letterSpacing: -0.2, marginTop: 4},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  rowC: {gap: 16, padding: 16},
  avatar: {width: 38, height: 38, alignItems: 'center', justifyContent: 'center'},
  tile: {width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center'},
  tileLetter: {width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center'},
  pill: {borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8},
  empty: {padding: 16, fontSize: 13},
  notice: {padding: 12},
});
