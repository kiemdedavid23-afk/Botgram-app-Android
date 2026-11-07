import React, {useState} from 'react';
import {View, Text, Pressable, Modal, StyleSheet} from 'react-native';
import {LogOut} from 'lucide-react-native';
import {useTheme, getShadow, memberProfileMetrics as m} from '../../../shared/theme';
import {leaveWorkspace} from '../../../core/api/endpoints/team';
import {applySignedOut} from '../../auth';
import {useAccess} from '../useAccess';
import {useWorkspaceStore} from '../store/workspaceStore';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {LEAVE_TITLE, leaveFailureMessage, leaveWarning} from './leaveLogic';

/** Bouton « Quitter l'entreprise » + confirmation explicite (le compte sera supprimé). */
export function LeaveCompanySection(): React.JSX.Element | null {
  const {colors, mode} = useTheme();
  const access = useAccess();
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!access.canLeave || !ws) return null;

  const confirm = async () => {
    setBusy(true);
    setError(null);
    const res = await leaveWorkspace(ws.id);
    if (res.ok) {
      // Compte supprimé côté Worker : on efface la session locale et on revient à la connexion.
      await applySignedOut('left_company');
      return;
    }
    setBusy(false);
    setError(leaveFailureMessage(res.error.code, res.status));
  };

  return (
    <View style={styles.block}>
      <Text style={[styles.title, {color: colors.textHint}]}>ENTREPRISE</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          setError(null);
          setOpen(true);
        }}
        style={[styles.row, {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft}, getShadow('sm', mode)]}>
        <LogOut size={18} color={colors.danger} />
        <Text style={{color: colors.danger, fontWeight: '600', fontSize: 15}}>Quitter l’entreprise</Text>
      </Pressable>

      <Modal visible={open} transparent animationType="fade" onRequestClose={() => !busy && setOpen(false)}>
        <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
          <View style={[styles.dialog, {backgroundColor: colors.bgPrimary}, getShadow('md', mode)]}>
            <Text style={[styles.dTitle, {color: colors.textPrimary}]}>{LEAVE_TITLE}</Text>
            <Text style={[styles.dBody, {color: colors.textSecondary}]}>{leaveWarning(ws.name)}</Text>
            {error ? <Text style={{color: colors.danger, fontSize: 13}}>{error}</Text> : null}
            <View style={styles.actions}>
              <Pressable
                disabled={busy}
                onPress={() => setOpen(false)}
                style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
                <Text style={{color: colors.textPrimary, fontWeight: '700'}}>Annuler</Text>
              </Pressable>
              <Pressable
                disabled={busy}
                onPress={() => fireAndForget(confirm())}
                style={[styles.btn, {backgroundColor: colors.danger, opacity: busy ? 0.6 : 1}]}>
                <Text style={{color: colors.white, fontWeight: '700'}}>
                  {busy ? 'Un instant…' : 'Quitter et supprimer mon compte'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  block: {gap: 8},
  title: {fontSize: m.sectionTitleSize, fontWeight: '700', letterSpacing: 1},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderRadius: m.cardRadius, borderWidth: 1},
  overlay: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
  dialog: {width: '100%', maxWidth: 420, borderRadius: 16, padding: 18, gap: 10},
  dTitle: {fontSize: 18, fontWeight: '700'},
  dBody: {fontSize: 14, lineHeight: 21},
  actions: {gap: 10, marginTop: 6},
  btn: {paddingVertical: 13, borderRadius: 12, alignItems: 'center'},
});
