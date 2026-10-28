import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, ScrollView, Modal} from 'react-native';
import {ChevronDown} from 'lucide-react-native';
import {authColors, authMetrics, authUi, welcomeMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {COUNTRIES, USAGES, USAGE_EMOJI, flagEmoji} from '../data/lists';
import {verifyCode} from '../../../core/api/endpoints/auth';
import {useAuthStore} from '../store/authStore';
import {AuthLightScaffold} from '../components/AuthLightScaffold';

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

const cap = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

type FieldProps = {
  emoji: string;
  label: string;
  hint?: string;
  focused?: boolean;
  error?: string;
  children: React.ReactNode;
};

/** Champ : libellé au-dessus, pastille emoji à gauche, bordure qui s'active au focus. */
function Field({emoji, label, hint, focused, error, children}: FieldProps): React.JSX.Element {
  return (
    <View style={styles.group}>
      <Text style={styles.label}>
        {label}
        {hint ? <Text style={styles.labelHint}> · {hint}</Text> : null}
      </Text>
      <View style={[styles.row, focused ? styles.rowFocused : null, error ? styles.rowError : null]}>
        <View style={styles.bubble}>
          <Text style={styles.bubbleEmoji}>{emoji}</Text>
        </View>
        {children}
      </View>
      {error ? <Text style={styles.fieldError}>⚠️ {error}</Text> : null}
    </View>
  );
}

export function ProfileScreen({email, code, onSuccess, onBack}: Props): React.JSX.Element {
  const [displayName, setDisplayName] = useState('');
  const [country, setCountry] = useState('BF');
  const [usage, setUsage] = useState<(typeof USAGES)[number]>(USAGES[0]);
  const [phone, setPhone] = useState('');
  const [organization, setOrganization] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [fields, setFields] = useState<Record<string, string>>({});
  const [countryOpen, setCountryOpen] = useState(false);
  const [focus, setFocus] = useState<'name' | 'phone' | 'org' | null>(null);
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

  const current = COUNTRIES.find(c => c.code === country);
  const countryName = current?.name ?? country;
  const dial = current?.dial ?? '226';

  return (
    <AuthLightScaffold step={3} onBack={onBack}>
      <View style={styles.badge}>
        <Text style={styles.badgeEmoji}>🎉</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {texts.profileHeadline}
      </Text>
      <Text style={styles.sub}>{texts.profileSub}</Text>

      <Field
        emoji="👤"
        label={texts.displayName}
        focused={focus === 'name'}
        error={fields.display_name}>
        <TextInput
          style={styles.input}
          value={displayName}
          onChangeText={setDisplayName}
          placeholder={texts.displayNameHint}
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          autoCapitalize="words"
          maxLength={80}
          onFocus={() => setFocus('name')}
          onBlur={() => setFocus(null)}
        />
      </Field>

      <Field emoji="🌍" label={texts.country}>
        <Pressable style={styles.select} onPress={() => setCountryOpen(true)} accessibilityRole="button">
          <Text style={styles.selectText}>
            {flagEmoji(country)}  {countryName}
          </Text>
          <ChevronDown size={20} color={authColors.textMuted} />
        </Pressable>
      </Field>

      <View style={styles.group}>
        <Text style={styles.label}>🎯 {texts.usageQuestion}</Text>
        <View style={styles.chips}>
          {USAGES.map(u => {
            const on = u === usage;
            return (
              <Pressable
                key={u}
                onPress={() => setUsage(u)}
                style={[styles.chip, on ? styles.chipOn : null]}
                accessibilityRole="button"
                accessibilityState={{selected: on}}>
                <Text style={[styles.chipText, on ? styles.chipTextOn : null]}>
                  {USAGE_EMOJI[u]} {cap(u)}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <Field emoji="📱" label={texts.phone} focused={focus === 'phone'} error={fields.phone}>
        <View style={styles.dial}>
          <Text style={styles.dialText}>+{dial}</Text>
        </View>
        <TextInput
          style={styles.input}
          value={phone}
          onChangeText={setPhone}
          placeholder="70 00 00 00"
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          keyboardType="phone-pad"
          onFocus={() => setFocus('phone')}
          onBlur={() => setFocus(null)}
        />
      </Field>

      <Field
        emoji="🏢"
        label={texts.organizationLabel}
        hint={texts.optional}
        focused={focus === 'org'}>
        <TextInput
          style={styles.input}
          value={organization}
          onChangeText={setOrganization}
          placeholder="Ma boutique, mon école…"
          placeholderTextColor={authColors.textMuted}
          selectionColor={authColors.accent}
          maxLength={80}
          onFocus={() => setFocus('org')}
          onBlur={() => setFocus(null)}
        />
      </Field>

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>⚠️ {error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.btn, busy ? styles.btnDisabled : null]}
        onPress={submit}
        disabled={busy}
        accessibilityRole="button">
        <Text style={styles.btnText}>{busy ? texts.finishBusy : `${texts.finish} 🚀`}</Text>
      </Pressable>

      <Modal visible={countryOpen} transparent animationType="slide" onRequestClose={() => setCountryOpen(false)}>
        <View style={styles.sheet}>
          <View style={styles.sheetCard}>
            <Text style={styles.sheetTitle}>🌍 {texts.country}</Text>
            <ScrollView style={styles.pickerScroll}>
              {COUNTRIES.map(c => (
                <Pressable
                  key={c.code}
                  style={styles.sheetItem}
                  onPress={() => {
                    setCountry(c.code);
                    setCountryOpen(false);
                  }}>
                  <Text style={[styles.pickerItemText, c.code === country ? styles.pickerItemOn : null]}>
                    {flagEmoji(c.code)}  {c.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
            <Pressable style={styles.sheetClose} onPress={() => setCountryOpen(false)}>
              <Text style={styles.pickerClose}>Fermer</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </AuthLightScaffold>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: authUi.accentSoft,
    borderWidth: 1,
    borderColor: authUi.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  badgeEmoji: {fontSize: 34},
  title: {textAlign: 'center', fontSize: 26, fontWeight: '700', color: authColors.text, marginBottom: 6},
  sub: {
    textAlign: 'center',
    color: authColors.textMuted,
    fontSize: authMetrics.helpSize,
    lineHeight: 21,
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  group: {marginBottom: 14},
  label: {fontSize: 14, fontWeight: '600', color: authUi.label, marginBottom: 6, marginLeft: 2},
  labelHint: {fontWeight: '400', color: authColors.textMuted},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: authUi.surface,
    borderWidth: 1.5,
    borderColor: authUi.surfaceBorder,
    borderRadius: 16,
    paddingHorizontal: 8,
    minHeight: 54,
  },
  rowFocused: {borderColor: authColors.accent, backgroundColor: authColors.white},
  rowError: {borderColor: authColors.danger, backgroundColor: authUi.dangerSoft},
  bubble: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: authUi.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  bubbleEmoji: {fontSize: 18},
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingRight: 8,
    fontSize: authMetrics.fieldFontSize,
    color: authColors.text,
  },
  select: {flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 14, paddingRight: 8},
  selectText: {fontSize: authMetrics.fieldFontSize, color: authColors.text},
  dial: {
    backgroundColor: authUi.accentSoft,
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 8,
  },
  dialText: {color: authUi.accentStrong, fontWeight: '700', fontSize: 15},
  fieldError: {color: authColors.danger, fontSize: 13, marginTop: 5, marginLeft: 4},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {
    paddingVertical: 9,
    paddingHorizontal: 14,
    borderRadius: 20,
    backgroundColor: authUi.surface,
    borderWidth: 1.5,
    borderColor: authUi.surfaceBorder,
  },
  chipOn: {backgroundColor: authColors.accent, borderColor: authColors.accent},
  chipText: {fontSize: 15, color: authUi.label, fontWeight: '500'},
  chipTextOn: {color: authColors.white, fontWeight: '700'},
  errorBox: {
    backgroundColor: authUi.dangerSoft,
    borderWidth: 1,
    borderColor: authUi.dangerBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginBottom: 4,
  },
  error: {color: authColors.danger, textAlign: 'center', fontSize: 14},
  btn: {
    marginTop: 14,
    height: welcomeMetrics.buttonHeight,
    borderRadius: welcomeMetrics.buttonRadius,
    backgroundColor: authColors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: authColors.fabShadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 4,
  },
  btnText: {color: authColors.white, fontWeight: '700', fontSize: welcomeMetrics.buttonFontSize},
  // opacity 0.6 — busy (Auth.css)
  btnDisabled: {opacity: 0.6},
  sheet: {flex: 1, backgroundColor: authColors.sheetOverlay, justifyContent: 'flex-end'},
  sheetCard: {backgroundColor: authColors.sheetBg, borderTopLeftRadius: authMetrics.sheetRadius, borderTopRightRadius: authMetrics.sheetRadius, padding: 18},
  sheetTitle: {fontSize: 18, fontWeight: '600', textAlign: 'center', marginBottom: 12, color: authColors.text},
  sheetItem: {paddingVertical: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: authColors.border},
  sheetClose: {marginTop: 12, padding: authMetrics.sheetButtonPadding, backgroundColor: authColors.sheetButton, borderRadius: authMetrics.sheetButtonRadius, alignItems: 'center'},
  // maxHeight 360 — liste pays (Auth.css sheet)
  pickerScroll: {maxHeight: 360},
  // fontSize 17 = authMetrics.fieldFontSize (Auth.css)
  pickerItemText: {fontSize: 17, color: authColors.text},
  pickerItemOn: {color: authColors.accent, fontWeight: '700'},
  // fontWeight 600 — bouton Fermer sheet (Auth.css / Design tokens §4)
  pickerClose: {color: authColors.accent, fontWeight: '600'},
});
