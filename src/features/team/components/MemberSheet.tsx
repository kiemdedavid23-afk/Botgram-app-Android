import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import type {InviteRole, TeamMember} from '../../../core/api/endpoints/team';
import {roleExplain, roleName} from '../utils/teamLogic';
import {useTeamPalette} from './teamPalette';
import {Button, Sheet} from './Sheet';

type Props = {
  member: TeamMember | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onRole: (role: InviteRole) => void;
  onTransfer: () => void;
  onRemove: () => void;
};

const ROLES: InviteRole[] = ['agent', 'viewer'];

/** Actions du propriétaire sur une personne (la feuille n'ouvre jamais pour lui-même). */
export function MemberSheet({member, busy, error, onClose, onRole, onTransfer, onRemove}: Props): React.JSX.Element {
  const p = useTeamPalette();
  return (
    <Sheet visible={member !== null} title={member?.display_name ?? ''} onClose={onClose}>
      <Text style={[styles.label, {color: p.inkSoft}]}>Rôle</Text>
      {ROLES.map(r => {
        const on = member?.role === r;
        return (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{selected: on, disabled: busy}}
            disabled={busy || on}
            onPress={() => onRole(r)}
            style={[styles.role, {borderRadius: p.radius, borderColor: on ? p.accent : p.line, backgroundColor: on ? p.accentSoft : p.optionBg}]}>
            <Text style={{color: p.ink, fontWeight: '700'}}>{roleName(r)}</Text>
            <Text style={{color: p.inkSoft, fontSize: 12, marginTop: 2}}>{roleExplain(r)}</Text>
          </Pressable>
        );
      })}
      {error ? <Text style={{color: p.danger, fontSize: 13}}>{error}</Text> : null}
      <View style={styles.gap}>
        <Button p={p} kind="ghost" label="Transférer la propriété…" disabled={busy} onPress={onTransfer} />
        <Button p={p} kind="danger" label="Retirer de l’entreprise…" disabled={busy} onPress={onRemove} />
      </View>
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  role: {borderWidth: 1.5, padding: 12},
  gap: {gap: 10, marginTop: 6},
});
