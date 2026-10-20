import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {requestCode} from '../../../core/api/endpoints/auth';
import {AuthHeader} from '../components/AuthHeader';

type Props = {onSent: (email: string, expiresIn: number) => void; onBack: () => void};

export function EmailScreen({onSent, onBack}: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);

  const submit = async () => {
    if (busy || !email.includes('@')) return;
    setBusy(true);
    setError('');
    const res = await requestCode(email.trim().toLowerCase());
    setBusy(false);
    if (res.ok) {
      onSent(email.trim().toLowerCase(), res.data.expires_in);
    } else if (res.error.code === 'RATE_LIMITED') {
      const wait = res.headers.get('retry-after');
      setError(texts.rateLimited(wait ? `${wait} s` : 'un instant'));
    } else if (res.error.code === 'EMAIL_QUOTA_EXCEEDED' || res.error.code === 'SERVICE_UNAVAILABLE') {
      setError(texts.emailQuota);
    } else {
      setError(res.error.message);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader title={texts.emailTitle} onBack={onBack} />
      <View style={styles.body}>
        <Text style={styles.help}>Nous vous enverrons un code de vérification.</Text>
        <TextInput
          style={[styles.field, {borderBottomColor: focused ? authColors.borderFocus : authColors.border}]}
          value={email}
          onChangeText={setEmail}
          placeholder={texts.emailPlaceholder}
          placeholderTextColor={authColors.textMuted}
          autoComplete="email"
          keyboardType="email-address"
          autoCapitalize="none"
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable style={[styles.btn, busy ? styles.btnDisabled : null]} onPress={submit} disabled={busy}>
          <Text style={styles.btnText}>{texts.sendCode}</Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg},
  body: {flex: 1, paddingHorizontal: authMetrics.bodyPaddingH, paddingTop: authMetrics.bodyPaddingTop},
  help: {textAlign: 'center', color: authColors.textMuted, fontSize: authMetrics.helpSize, lineHeight: 21, marginBottom: 22},
  field: {
    borderBottomWidth: 1,
    paddingVertical: authMetrics.fieldPaddingV,
    paddingHorizontal: authMetrics.fieldPaddingH,
    fontSize: authMetrics.fieldFontSize,
    color: authColors.text,
  },
  error: {color: authColors.danger, marginTop: 12, textAlign: 'center'},
  btn: {marginTop: 32, alignSelf: 'center', backgroundColor: authColors.accent, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20},
  btnText: {color: authColors.white, fontWeight: '600', fontSize: 16},
  // opacity 0.6 — état busy (Auth.css)
  btnDisabled: {opacity: 0.6},
});
