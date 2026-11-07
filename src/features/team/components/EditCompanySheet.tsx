import React, {useEffect, useState} from 'react';
import {Text, TextInput, Pressable, View, StyleSheet} from 'react-native';
import type {Workspace} from '../../../core/api/endpoints/workspaces';
import {COUNTRY_CODES, countryLabel} from '../../member/utils/format';
import {useTeamStore} from '../store/teamStore';
import {buildCompanyPatch, isEmptyPatch} from '../utils/teamLogic';
import {useTeamPalette} from './teamPalette';
import {Button, Sheet} from './Sheet';

type Props = {visible: boolean; workspace: Workspace; onClose: () => void};

export function EditCompanySheet({visible, workspace, onClose}: Props): React.JSX.Element {
  const p = useTeamPalette();
  const editCompany = useTeamStore(s => s.editCompany);
  const busy = useTeamStore(s => s.busy) === 'company';
  const [name, setName] = useState('');
  const [sector, setSector] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [pick, setPick] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setName(workspace.name);
    setSector(workspace.sector ?? '');
    setPhone(workspace.phone ?? '');
    setCountry(workspace.country ?? '');
    setPick(false);
    setError(null);
  }, [visible, workspace]);

  const save = async () => {
    const check = buildCompanyPatch({name, sector, phone, country}, workspace);
    if (!check.ok) {
      setError(check.message);
      return;
    }
    if (isEmptyPatch(check.patch)) {
      onClose();
      return;
    }
    const res = await editCompany(workspace.id, check.patch);
    if (res.ok) onClose();
    else setError(res.message);
  };

  const field = (label: string, value: string, set: (v: string) => void, extra?: {keyboardType?: 'phone-pad'; max?: number}) => (
    <View style={styles.field}>
      <Text style={[styles.label, {color: p.inkSoft}]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={set}
        maxLength={extra?.max ?? 80}
        keyboardType={extra?.keyboardType}
        placeholderTextColor={p.inkSoft}
        style={[styles.input, {color: p.ink, borderColor: p.fieldBorder, backgroundColor: p.field, borderRadius: p.radius}]}
      />
    </View>
  );

  return (
    <Sheet visible={visible} title="Modifier l’entreprise" onClose={onClose}>
      {field('Nom', name, setName)}
      {field('Secteur', sector, setSector)}
      {field('Téléphone (avec +)', phone, setPhone, {keyboardType: 'phone-pad', max: 25})}
      <View style={styles.field}>
        <Text style={[styles.label, {color: p.inkSoft}]}>Pays</Text>
        <Pressable
          onPress={() => setPick(v => !v)}
          style={[styles.input, {borderColor: p.fieldBorder, backgroundColor: p.field, borderRadius: p.radius}]}>
          <Text style={{color: p.ink}}>{country ? countryLabel(country) : 'Choisir…'}</Text>
        </Pressable>
        {pick
          ? COUNTRY_CODES.map(c => (
              <Pressable
                key={c}
                onPress={() => {
                  setCountry(c);
                  setPick(false);
                }}
                style={styles.opt}>
                <Text style={{color: c === country ? p.accent : p.ink, fontWeight: c === country ? '700' : '400'}}>{countryLabel(c)}</Text>
              </Pressable>
            ))
          : null}
      </View>
      {error ? <Text style={{color: p.danger, fontSize: 13}}>{error}</Text> : null}
      <Button p={p} label={busy ? 'Enregistrement…' : 'Enregistrer'} disabled={busy} onPress={() => void save()} />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  field: {gap: 6},
  label: {fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  input: {borderWidth: 1, paddingHorizontal: 12, paddingVertical: 12, fontSize: 15},
  opt: {paddingVertical: 10, paddingHorizontal: 6},
});
