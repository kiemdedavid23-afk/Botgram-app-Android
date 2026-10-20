import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Modal} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {COUNTRIES, USAGES} from '../data/lists';
import {verifyCode} from '../../../core/api/endpoints/auth';
import {useAuthStore} from '../store/authStore';
import {AuthHeader} from '../components/AuthHeader';

type Props = {email: string; code: string; onSuccess: () => void; onBack: () => void};

function fieldMessage(reason: string): string {
  switch (reason) {
    case 'required':
    case 'too_short':
      return texts.fieldRequired;
    case 'too_long':
      return texts.fieldTooLong;
    case 'bad_format':
      return texts.fieldBadFormat;
    default:
      return 'Valeur invalide.';
  }
}

export function ProfileScreen({email, code, onSuccess, onBack}: Props): React.JSX.Element {
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('BF');
  const [usage, setUsage] = useState(USAGES[0]);
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [picker, setPicker] = useState<'country' | 'usage' | null>(null);
  const completeVerify = useAuthStore(s => s.completeVerify);
  const setPendingCode = useAuthStore(s => s.setPendingCode);

  const submit = async () => {
    if (busy) return;
    setBusy(true);
    setError('');
    setFields({});
    const dial = COUNTRIES.find(c => c.code === country)?.dial ?? '226';
    const digits = phone.replace(/\D/g, '').replace(/^0+/, '');
    const fullPhone = `+${dial}${digits}`;
    const res = await verifyCode({
      email,
      code,
      display_name: displayName.trim(),
      country,
      usage,
      phone: fullPhone,
      organization: organization.trim() || undefined,
    });
    setBusy(false);
    if (res.ok && !('needs_profile' in res.data)) {
      setPendingCode(null);
      await completeVerify(res.data);
      onSuccess();
    } else if (!res.ok && res.error.code === 'VALIDATION_ERROR') {
      const f = (res.error.details as {fields?: Record<string, string>})?.fields ?? {};
      const translated: Record<string, string> = {};
      for (const [k, v] of Object.entries(f)) translated[k] = fieldMessage(String(v));
      setFields(translated);
      setError('Vérifiez les champs signalés.');
    } else if (!res.ok) {
      setError(res.error.message);
    }
  };

  const countryName = COUNTRIES.find(c => c.code === country)?.name ?? country;

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader title={texts.profileTitle} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.body}>
        <TextInput
          style={styles.field}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={texts.displayName}
          placeholderTextColor={authColors.textMuted}
          maxLength={80}
        />
        {fields.display_name ? <Text style={styles.fieldError}>{fields.display_name}</Text> : null}

        <Pressable style={styles.field} onPress={() => setPicker('country')}>
          <Text style={{fontSize: authMetrics.fieldFontSize, color: authColors.text}}>{countryName}</Text>
        </Pressable>

        <Pressable style={styles.field} onPress={() => setPicker('usage')}>
          <Text style={{fontSize: authMetrics.fieldFontSize, color: authColors.text}}>{usage}</Text>
        </Pressable>

        <TextInput
          style={styles.field}
          value={phone}
          onChangeText={setPhone}
          placeholder={texts.phone}
          placeholderTextColor={authColors.textMuted}
          keyboardType="phone-pad"
        />
        {fields.phone ? <Text style={styles.fieldError}>{fields.phone}</Text> : null}

        <TextInput
          style={styles.field}
          value={organization}
          onChangeText={setOrganization}
          placeholder={texts.organization}
          placeholderTextColor={authColors.textMuted}
          maxLength={80}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.btn, {opacity: busy ? 0.6 : 1}]} onPress={submit} disabled={busy}>
          <Text style={styles.btnText}>{texts.finish}</Text>
        </Pressable>
      </ScrollView>

      <Modal visible={picker !== null} transparent animationType="slide">
        <View style={styles.sheet}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>{picker === 'country' ? texts.country : texts.usage}</Text>
            <ScrollView style={{maxHeight: 360}}>
              {(picker === 'country' ? COUNTRIES.map(c => c.code) : [...USAGES]).map(item => (
                <Pressable
                  key={item}
                  style={styles.sheetItem}
                  onPress={() => {
                    if (picker === 'country') setCountry(item);
                    else setUsage(item as (typeof USAGES)[number]);
                    setPicker(null);
                  }}>
                  <Text style={{fontSize: 17, color: authColors.text}}>
                    {picker === 'country' ? COUNTRIES.find(c => c.code === item)?.name : item}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.sheetClose} onPress={() => setPicker(null)}>
              <Text style={{color: authColors.accent, fontWeight: '600'}}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg},
  body: {paddingHorizontal: authMetrics.bodyPaddingH, paddingTop: 8, paddingBottom: 48},
  field: {
    borderBottomWidth: 1,
    borderBottomColor: authColors.border,
    paddingVertical: authMetrics.fieldPaddingV,
    paddingHorizontal: authMetrics.fieldPaddingH,
    fontSize: authMetrics.fieldFontSize,
    color: authColors.text,
    marginTop: 8,
  },
  fieldError: {color: authColors.danger, fontSize: 13, marginTop: 4},
  error: {color: authColors.danger, marginTop: 16, textAlign: 'center'},
  btn: {marginTop: 32, alignSelf: 'center', backgroundColor: authColors.accent, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20},
  btnText: {color: authColors.white, fontWeight: '600'},
  sheet: {flex: 1, backgroundColor: authColors.sheetOverlay, justifyContent: 'flex-end'},
  sheetCard: {backgroundColor: authColors.sheetBg, borderTopLeftRadius: authMetrics.sheetRadius, borderTopRightRadius: authMetrics.sheetRadius, padding: 18},
  sheetTitle: {fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12, color: authColors.text},
  sheetItem: {paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: authColors.border},
  sheetClose: {marginTop: 12, padding: authMetrics.sheetButtonPadding, backgroundColor: authColors.sheetButton, borderRadius: authMetrics.sheetButtonRadius, alignItems: 'center'},
});
