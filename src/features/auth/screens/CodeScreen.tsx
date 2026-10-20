import React, {useEffect, useState} from 'react';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform} from 'react-native';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {verifyCode, requestCode} from '../../../core/api/endpoints/auth';
import {useAuthStore} from '../store/authStore';
import {AuthHeader} from '../components/AuthHeader';

type Props = {
  email: string;
  expiresIn: number;
  onNeedsProfile: () => void;
  onSuccess: () => void;
  onBack: () => void;
};

export function CodeScreen({email, expiresIn, onNeedsProfile, onSuccess, onBack}: Props): React.JSX.Element {
  const [digits, setDigits] = useState(['', '', '', '', '', '']);
  const [left, setLeft] = useState(expiresIn);
  const [resendLeft, setResendLeft] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const completeVerify = useAuthStore(s => s.completeVerify);
  const setPendingCode = useAuthStore(s => s.setPendingCode);

  useEffect(() => {
    const t = setInterval(() => {
      setLeft(v => Math.max(0, v - 1));
      setResendLeft(v => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const code = digits.join('');
  const expired = left === 0;

  const submit = async () => {
    if (busy || code.length !== 6 || expired) return;
    setBusy(true);
    setError('');
    const res = await verifyCode({email, code});
    setBusy(false);
    if (res.ok) {
      if ('needs_profile' in res.data) {
        setPendingCode(code);
        onNeedsProfile();
      } else {
        await completeVerify(res.data);
        onSuccess();
      }
    } else if (res.error.code === 'CODE_INVALID') {
      const reason = (res.error.details as {reason?: string})?.reason;
      if (reason === 'too_many_attempts') setError(texts.tooManyAttempts);
      else if (reason === 'expired') setError(texts.codeExpired);
      else setError(texts.codeInvalid);
    } else if (res.error.code === 'ACCOUNT_DISABLED') {
      setError(texts.accountDisabled);
    } else if (res.error.code === 'RATE_LIMITED') {
      const wait = res.headers.get('retry-after');
      setError(texts.rateLimited(wait ? `${wait} s` : 'un instant'));
    } else {
      setError(res.error.message);
    }
  };

  const resend = async () => {
    if (resendLeft > 0 || busy) return;
    setBusy(true);
    const res = await requestCode(email);
    setBusy(false);
    if (res.ok) {
      setLeft(res.data.expires_in);
      setResendLeft(30);
      setDigits(['', '', '', '', '', '']);
      setError('');
    } else if (res.error.code === 'RATE_LIMITED') {
      const wait = res.headers.get('retry-after');
      setError(texts.rateLimited(wait ? `${wait} s` : 'un instant'));
    } else if (res.error.code === 'EMAIL_QUOTA_EXCEEDED' || res.error.code === 'SERVICE_UNAVAILABLE') {
      setError(texts.emailQuota);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <AuthHeader title={texts.codeTitle} onBack={onBack} />
      <View style={styles.body}>
        <Text style={styles.help}>{email}</Text>
        <Text style={styles.timer}>{expired ? 'Code expiré' : texts.expiresIn(left)}</Text>
        <View style={styles.boxes}>
          {digits.map((d, i) => (
            <View key={i} style={styles.box}>
              <Text style={styles.digit}>{d}</Text>
            </View>
          ))}
        </View>
        <TextInput
          style={styles.hidden}
          value={code}
          onChangeText={t => {
            const clean = t.replace(/\D/g, '').slice(0, 6);
            const next = ['', '', '', '', '', ''];
            for (let i = 0; i < clean.length; i += 1) next[i] = clean[i] ?? '';
            setDigits(next);
            if (clean.length === 6 && !expired) fireAndForget(submit());
          }}
          keyboardType="number-pad"
          autoComplete="one-time-code"
          maxLength={6}
          autoFocus
        />
        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Pressable
          style={[styles.btn, {opacity: busy || expired || code.length !== 6 ? 0.5 : 1}]}
          onPress={submit}
          disabled={busy || expired || code.length !== 6}>
          <Text style={styles.btnText}>{texts.verify}</Text>
        </Pressable>
        <Pressable style={{marginTop: 20, opacity: resendLeft > 0 ? 0.5 : 1}} onPress={resend} disabled={resendLeft > 0 || busy}>
          <Text style={{color: authColors.accent, textAlign: 'center'}}>
            {resendLeft > 0 ? texts.resendIn(resendLeft) : texts.resend}
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg},
  body: {flex: 1, paddingHorizontal: authMetrics.bodyPaddingH, paddingTop: 16, alignItems: 'center'},
  help: {color: authColors.textMuted, fontSize: authMetrics.helpSize, marginBottom: 8},
  timer: {color: authColors.textMuted, marginBottom: 24},
  boxes: {flexDirection: 'row', gap: authMetrics.codeGap},
  box: {
    width: authMetrics.codeBoxWidth,
    height: authMetrics.codeBoxHeight,
    borderBottomWidth: authMetrics.codeBorderWidth,
    borderBottomColor: authColors.codeBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  digit: {fontSize: authMetrics.codeFontSize, color: authColors.text, fontWeight: '600'},
  hidden: {position: 'absolute', opacity: 0, height: 1, width: 1},
  error: {color: authColors.danger, marginTop: 16, textAlign: 'center'},
  btn: {marginTop: 32, backgroundColor: authColors.accent, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 20},
  btnText: {color: authColors.white, fontWeight: '600'},
});
