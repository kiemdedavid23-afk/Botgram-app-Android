import React, {useEffect} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useAuthStore} from '../../auth';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useTeamStore} from '../store/teamStore';
import {assignableMembers, roleName} from '../utils/teamLogic';
import {useTeamPalette} from './teamPalette';
import {Button, Sheet} from './Sheet';

type Props = {
  visible: boolean;
  workspaceId: string | null;
  /** Personne actuellement en charge (null : libre). */
  currentId: string | null;
  busy?: boolean;
  /** memberId, ou null pour libérer la conversation. */
  onSelect: (memberId: string | null) => void;
  onClose: () => void;
};

/** Choix de la personne en charge d'une conversation (propriétaire et agents seulement). */
export function AssignSheet({visible, workspaceId, currentId, busy, onSelect, onClose}: Props): React.JSX.Element {
  const p = useTeamPalette();
  const selfId = useAuthStore(s => s.member?.id ?? null);
  const members = useTeamStore(s => s.members);
  const loaded = useTeamStore(s => s.loaded);
  const load = useTeamStore(s => s.load);

  useEffect(() => {
    if (visible && workspaceId) fireAndForget(load(workspaceId));
  }, [visible, workspaceId, load]);

  const list = assignableMembers(members);
  return (
    <Sheet visible={visible} title="Assigner la conversation" onClose={onClose}>
      {!loaded && list.length === 0 ? <Text style={{color: p.inkSoft}}>Chargement…</Text> : null}
      {list.map(m => {
        const on = m.member_id === currentId;
        return (
          <Pressable
            key={m.member_id}
            accessibilityRole="radio"
            accessibilityState={{selected: on, disabled: !!busy}}
            disabled={busy || on}
            onPress={() => onSelect(m.member_id)}
            style={[styles.row, {borderRadius: p.radius, borderColor: on ? p.accent : p.line, backgroundColor: on ? p.accentSoft : p.surface}]}>
            <Text style={{color: p.ink, fontWeight: '700', flex: 1}} numberOfLines={1}>
              {m.display_name}{m.member_id === selfId ? ' (vous)' : ''}
            </Text>
            <Text style={{color: p.inkSoft, fontSize: 12.5}}>{roleName(m.role)}</Text>
          </Pressable>
        );
      })}
      {currentId ? (
        <View style={styles.free}>
          <Button p={p} kind="ghost" label="Libérer la conversation" disabled={busy} onPress={() => onSelect(null)} />
        </View>
      ) : null}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, borderWidth: 1.5, padding: 14},
  free: {marginTop: 4},
});
