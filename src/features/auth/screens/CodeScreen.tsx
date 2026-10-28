import React, {useEffect, useRef, useState} from 'react';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {View, Text, TextInput, Pressable, StyleSheet, AppState} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {authColors, authMetrics, authUi, welcomeMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';
import {verifyCode, requestCode} from '../../../core/api/endpoints/auth';
import {useAuthStore} from '../store/authStore';
import {AuthLightScaffold} from '../components/AuthLightScaffold';
import {mailTargetFor, openMailApp} from '../utils/openMailApp';

type Props = {
  email: string;
  expiresIn: number;
  onNeedsProfile: () => void;
  onSuccess: () => void;
  onBack: () => void;
};

const EMPTY = ['', '', '', '', '', ''];

export function CodeScreen({email, expiresIn, onNeedsProfile, onSuccess, onBack}: Props): React.JSX.Element {
  const [digits, setDigits] = useState(EMPTY);
  const [left, setLeft] = useState(expiresIn);
  const [resendLeft, setResendLeft] = useState(30);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const wentToMail = useRef(false);
  const completeVerify = useAuthStore(s => s.completeVerify);
  const setPendingCode = useAuthStore(s => s.setPendingCode);
  const mail = mailTargetFor(email);

  useEffect(() => {
    const t = setInterval(() => {
      setLeft(v => Math.max(0, v - 1));
      setResendLeft(v => Math.max(0, v - 1));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const code = digits.join('');
  const expired = left === 0;

  // `codeArg` : code saisi à l'instant (le state n'est pas encore à jour quand on valide
  // automatiquement au 6e chiffre ou après un collage).
  const submit = async (codeArg?: string) => {
    const c = codeArg ?? code;
    if (busy || c.length !== 6 || expired) return;
    setBusy(true);
    setError('');
    const res = await verifyCode({email, code: c});
    setBusy(false);
    if (res.ok) {
      if ('needs_profile' in res.data) {
        setPendingCode(c);
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

  const applyCode = (raw: string) => {
    const clean = raw.replace(/\D/g, '').slice(0, 6);
    const next = [...EMPTY];
    for (let i = 0; i < clean.length; i += 1) next[i] = clean[i] ?? '';
    setDigits(next);
    setError('');
    if (clean.length === 6 && !expired) fireAndForget(submit(clean));
  };

  // Dernière version de applyCode, pour l'écouteur AppState (enregistré une seule fois).
  const applyRef = useRef(applyCode);
  applyRef.current = applyCode;

  const pasteFromClipboard = async (silent: boolean) => {
    try {
      const text = await Clipboard.getString();
      const m = /(?:^|\D)(\d{6})(?:\D|$)/.exec(text);
      if (m?.[1]) {
        applyRef.current(m[1]);
        return;
      }
    } catch {
      // presse-papiers indisponible : on affiche le message ci-dessous
    }
    if (!silent) setError(texts.noCodeInClipboard);
  };

  // Retour depuis la messagerie : si un code à 6 chiffres vient d'être copié, on le saisit.
  useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active' && wentToMail.current) {
        wentToMail.current = false;
        fireAndForget(pasteFromClipboard(true));
      }
    });
    return () => sub.remove();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const openMail = async () => {
    wentToMail.current = true;
    const ok = await openMailApp(email);
    if (!ok) wentToMail.current = false;
  };

  const resend = async () => {
    if (resendLeft > 0 || busy) return;
    setBusy(true);
    const res = await requestCode(email);
    setBusy(false);
    if (res.ok) {
      setLeft(res.data.expires_in);
      setResendLeft(30);
      setDigits(EMPTY);
      setError('');
    } else if (res.error.code === 'RATE_LIMITED') {
      const wait = res.headers.get('retry-after');
      setError(texts.rateLimited(wait ? `${wait} s` : 'un instant'));
    } else if (res.error.code === 'EMAIL_QUOTA_EXCEEDED' || res.error.code === 'SERVICE_UNAVAILABLE') {
      setError(texts.emailQuota);
    }
  };

  const urgent = !expired && left <= 60;
  const activeIndex = Math.min(code.length, 5);
  const verifyDisabled = busy || expired || code.length !== 6;

  return (
    <AuthLightScaffold step={2} onBack={onBack}>
      <View style={styles.badge}>
        <Text style={styles.badgeEmoji}>📬</Text>
      </View>
      <Text style={styles.title} accessibilityRole="header">
        {texts.codeHeadline}
      </Text>
      <Text style={styles.sub}>{texts.codeSentTo}</Text>

      <View style={styles.emailCard}>
        <Text style={styles.emailIcon}>✉️</Text>
        <Text style={styles.emailText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.7}>
          {email}
        </Text>
      </View>
      <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
        <Text style={styles.wrong}>
          {texts.codeWrongEmail} <Text style={styles.wrongLink}>{texts.codeChangeEmail}</Text>
        </Text>
      </Pressable>

      <View
        style={[
          styles.timer,
          expired ? styles.timerExpired : urgent ? styles.timerUrgent : null,
        ]}>
        <Text
          style={[
            styles.timerText,
            expired || urgent ? styles.timerTextAlert : null,
          ]}>
          {expired ? `⌛ ${texts.codeExpiredChip}` : `⏳ ${texts.expiresIn(left)}`}
        </Text>
      </View>

      <Pressable style={styles.boxes} onPress={() => inputRef.current?.focus()}>
        {digits.map((d, i) => (
          <View
            key={i}
            style={[
              styles.box,
              d ? styles.boxFilled : null,
              focused && i === activeIndex ? styles.boxActive : null,
            ]}>
            <Text style={styles.digit}>{d}</Text>
          </View>
        ))}
      </Pressable>
      <TextInput
        ref={inputRef}
        style={styles.hidden}
        value={code}
        onChangeText={applyCode}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        keyboardType="number-pad"
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        maxLength={6}
        autoFocus
        caretHidden
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.error}>⚠️ {error}</Text>
        </View>
      ) : null}

      <Pressable
        style={[styles.btn, verifyDisabled ? styles.btnDisabled : null]}
        onPress={() => fireAndForget(submit())}
        disabled={verifyDisabled}
        accessibilityRole="button">
        <Text style={styles.btnText}>{texts.verify} ✅</Text>
      </Pressable>

      <View style={styles.actions}>
        <Pressable style={styles.action} onPress={() => fireAndForget(openMail())} accessibilityRole="button">
          <Text style={styles.actionText}>📬 {mail.label}</Text>
        </Pressable>
        <Pressable
          style={styles.action}
          onPress={() => fireAndForget(pasteFromClipboard(false))}
          accessibilityRole="button">
          <Text style={styles.actionText}>📋 {texts.pasteCode}</Text>
        </Pressable>
      </View>

      <Text style={styles.tip}>💡 {texts.codeSpamTip}</Text>

      <Pressable
        style={[styles.resend, resendLeft > 0 ? styles.resendDisabled : null]}
        onPress={() => fireAndForget(resend())}
        disabled={resendLeft > 0 || busy}>
        <Text style={styles.resendText}>
          {resendLeft > 0 ? texts.resendIn(resendLeft) : `🔄 ${texts.resend}`}
        </Text>
      </Pressable>
    </AuthLightScaffold>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: authUi.accentSoft,
    borderWidth: 1,
    borderColor: authUi.accentBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  badgeEmoji: {fontSize: 36},
  title: {
    textAlign: 'center',
    fontSize: 26,
    fontWeight: '700',
    color: authColors.text,
    marginBottom: 6,
  },
  sub: {textAlign: 'center', color: authColors.textMuted, fontSize: authMetrics.helpSize, marginBottom: 14},
  emailCard: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'center',
    maxWidth: '100%',
    gap: 10,
    backgroundColor: authUi.accentSoft,
    borderWidth: 1.5,
    borderColor: authUi.accentBorder,
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 18,
    shadowColor: authColors.fabShadow,
    shadowOpacity: 1,
    shadowRadius: 12,
    shadowOffset: {width: 0, height: 4},
    elevation: 2,
  },
  emailIcon: {fontSize: 22},
  emailText: {flexShrink: 1, fontSize: 18, fontWeight: '700', color: authUi.accentStrong},
  wrong: {textAlign: 'center', color: authColors.textMuted, fontSize: 14, marginTop: 10},
  wrongLink: {color: authColors.accent, fontWeight: '600'},
  timer: {
    alignSelf: 'center',
    backgroundColor: authUi.surface,
    borderRadius: 14,
    paddingVertical: 6,
    paddingHorizontal: 14,
    marginTop: 18,
    marginBottom: 20,
  },
  timerUrgent: {backgroundColor: authUi.warnSoft},
  timerExpired: {backgroundColor: authUi.dangerSoft},
  timerText: {color: authUi.label, fontSize: 14, fontWeight: '500'},
  timerTextAlert: {color: authUi.warn, fontWeight: '600'},
  boxes: {flexDirection: 'row', justifyContent: 'center', gap: authMetrics.codeGap},
  box: {
    width: authMetrics.codeBoxWidth,
    height: authMetrics.codeBoxHeight + 8,
    borderRadius: 12,
    backgroundColor: authUi.surface,
    borderWidth: 1.5,
    borderColor: authUi.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boxFilled: {backgroundColor: authUi.accentSoft, borderColor: authUi.accentBorder},
  boxActive: {borderColor: authColors.accent, backgroundColor: authColors.white},
  digit: {fontSize: authMetrics.codeFontSize, color: authColors.text, fontWeight: '700'},
  hidden: {position: 'absolute', opacity: 0, height: 1, width: 1},
  errorBox: {
    backgroundColor: authUi.dangerSoft,
    borderWidth: 1,
    borderColor: authUi.dangerBorder,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 14,
    marginTop: 16,
  },
  error: {color: authColors.danger, textAlign: 'center', fontSize: 14},
  btn: {
    marginTop: 24,
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
  // opacity 0.5 — état désactivé (Auth.css bouton verify disabled)
  btnDisabled: {opacity: 0.5},
  actions: {flexDirection: 'row', gap: 10, marginTop: 14},
  action: {
    flex: 1,
    height: 46,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: authUi.accentBorder,
    backgroundColor: authColors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  actionText: {color: authUi.accentStrong, fontWeight: '600', fontSize: 14},
  tip: {textAlign: 'center', color: authColors.textMuted, fontSize: 13, marginTop: 14},
  resend: {marginTop: 14, alignSelf: 'center', paddingVertical: 6},
  resendDisabled: {opacity: 0.5},
  resendText: {color: authColors.accent, textAlign: 'center', fontWeight: '600'},
});
