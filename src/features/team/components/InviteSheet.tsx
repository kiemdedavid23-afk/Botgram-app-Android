import React, {useEffect, useState} from 'react';
import {View, Text, TextInput, Pressable, Switch, Share, StyleSheet} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import type {CreatedInvite, InviteRole, Invite} from '../../../core/api/endpoints/team';
import {useTeamStore} from '../store/teamStore';
import {
  mailFailureLabel,
  roleExplain,
  roleName,
  shareInviteText,
  validateInvite,
  normalizeEmail,
  INVITE_VALIDITY_DAYS,
} from '../utils/teamLogic';
import {useTeamPalette} from './teamPalette';
import {Button, Sheet} from './Sheet';

type Props = {
  visible: boolean;
  workspaceId: string;
  companyName: string;
  seats: number;
  pending: readonly Invite[];
  onClose: () => void;
};

const ROLES: InviteRole[] = ['agent', 'viewer'];

export function InviteSheet({visible, workspaceId, companyName, seats, pending, onClose}: Props): React.JSX.Element {
  const p = useTeamPalette();
  const invite = useTeamStore(s => s.invite);
  const busy = useTeamStore(s => s.busy) === 'invite';
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<InviteRole>('agent');
  const [send, setSend] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{created: CreatedInvite; email: string} | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (visible) {
      setEmail('');
      setRole('agent');
      setSend(true);
      setError(null);
      setResult(null);
      setCopied(false);
    }
  }, [visible]);

  const submit = async () => {
    const check = validateInvite(email, seats, pending);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    setError(null);
    const clean = normalizeEmail(email);
    const res = await invite(workspaceId, clean, role, send);
    if (res.ok) setResult({created: res.data, email: clean});
    else setError(res.message);
  };

  if (result) {
    const code = result.created.code;
    const mail = result.created.email;
    return (
      <Sheet visible={visible} title="Invitation créée" onClose={onClose}>
        <Text style={[styles.note, {color: p.inkSoft}]}>
          Ce code ne s’affichera qu’une seule fois. Transmettez-le à {result.email}.
        </Text>
        <View style={[styles.codeBox, {backgroundColor: p.accentSoft, borderRadius: p.radius}]}>
          <Text selectable style={[styles.code, {color: p.ink}]}>{code}</Text>
        </View>
        {mail ? (
          <Text style={{color: mail.sent ? p.good : p.danger, fontSize: 13}}>
            {mail.sent ? 'E-mail envoyé.' : mailFailureLabel(mail.reason)}
          </Text>
        ) : null}
        <Text style={[styles.note, {color: p.inkSoft}]}>
          Valable {INVITE_VALIDITY_DAYS} jours. La personne doit s’inscrire avec la même adresse e-mail, en choisissant « Invité ».
        </Text>
        <View style={styles.row}>
          <Button
            p={p}
            kind="ghost"
            label={copied ? 'Copié ✓' : 'Copier le code'}
            onPress={() => {
              Clipboard.setString(code);
              setCopied(true);
            }}
          />
          <Button
            p={p}
            label="Partager"
            onPress={() => {
              Share.share({message: shareInviteText(code, companyName, result.email)}).catch(() => undefined);
            }}
          />
        </View>
        <Button p={p} kind="ghost" label="Terminer" onPress={onClose} />
      </Sheet>
    );
  }

  return (
    <Sheet visible={visible} title="Inviter une personne" onClose={onClose}>
      <Text style={[styles.label, {color: p.inkSoft}]}>Adresse e-mail</Text>
      <TextInput
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        autoCorrect={false}
        keyboardType="email-address"
        placeholder="collegue@exemple.com"
        placeholderTextColor={p.inkSoft}
        maxLength={254}
        style={[styles.input, {color: p.ink, borderColor: p.fieldBorder, backgroundColor: p.field, borderRadius: p.radius}]}
      />
      <Text style={[styles.label, {color: p.inkSoft}]}>Rôle</Text>
      <View style={styles.row}>
        {ROLES.map(r => (
          <Pressable
            key={r}
            accessibilityRole="radio"
            accessibilityState={{selected: role === r}}
            onPress={() => setRole(r)}
            style={[
              styles.role,
              {borderRadius: p.radius, borderColor: role === r ? p.accent : p.line, backgroundColor: role === r ? p.accentSoft : p.optionBg},
            ]}>
            <Text style={{color: p.ink, fontWeight: '700'}}>{roleName(r)}</Text>
            <Text style={{color: p.inkSoft, fontSize: 12, marginTop: 2}}>{roleExplain(r)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.switchRow}>
        <Text style={{color: p.ink, flex: 1}}>Envoyer le code par e-mail</Text>
        <Switch value={send} onValueChange={setSend} trackColor={{true: p.accent, false: p.line}} />
      </View>
      <Text style={[styles.note, {color: p.inkSoft}]}>
        {seats > 0 ? `${seats} place${seats > 1 ? 's' : ''} restante${seats > 1 ? 's' : ''} (invitations en attente comprises).` : 'Plus de place : révoquez une invitation ou retirez une personne.'}
      </Text>
      {error ? <Text style={{color: p.danger, fontSize: 13}}>{error}</Text> : null}
      <Button p={p} label={busy ? 'Création…' : 'Créer l’invitation'} disabled={busy} onPress={() => void submit()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  label: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  input: {borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15},
  row: {flexDirection: 'row', gap: 10},
  role: {flex: 1, borderWidth: 1.5, padding: 12},
  switchRow: {flexDirection: 'row', alignItems: 'center', gap: 10},
  note: {fontSize: 13, lineHeight: 19},
  codeBox: {paddingVertical: 20, alignItems: 'center'},
  code: {fontSize: 30, fontWeight: '700', letterSpacing: 4},
});
