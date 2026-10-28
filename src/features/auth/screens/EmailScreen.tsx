import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {authDark, authMetrics, welcomeMetrics} from '../../../shared/theme/authColors';
import {shellMetrics as sm} from '../../../shared/theme/shellMetrics';
import {texts} from '../texts';
import {requestCode} from '../../../core/api/endpoints/auth';
import {AuthBackground} from '../components/AuthBackground';

type Props = {onSent: (email: string, expiresIn: number) => void; onBack: () => void};

export function EmailScreen({onSent, onBack}: Props): React.JSX.Element {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [focused, setFocused] = useState(false);
  const insets = useSafeAreaInsets();

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
    <AuthBackground>
      {/*
        Clavier : on utilise 'padding' sur Android ET iOS. Le calcul de KeyboardAvoidingView
        est basé sur le chevauchement réel clavier/écran : si Android a déjà redimensionné la
        fenêtre (adjustResize), le chevauchement est nul et rien n'est ajouté en double.
        Le ScrollView centre le formulaire dans l'espace restant et défile si l'écran est trop court.
      */}
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <ScrollView
          contentContainerStyle={[
            styles.scroll,
            {
              paddingTop: insets.top + authMetrics.headHeight,
              paddingBottom: insets.bottom + welcomeMetrics.footerPaddingBottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.center}>
            <Text style={styles.title} accessibilityRole="header">
              {texts.emailTitle}
            </Text>
            <Text style={styles.help}>{texts.emailHelp}</Text>
            <TextInput
              style={[
                styles.field,
                {borderBottomColor: focused ? authDark.borderFocus : authDark.border},
              ]}
              value={email}
              onChangeText={setEmail}
              placeholder={texts.emailPlaceholder}
              placeholderTextColor={authDark.placeholder}
              selectionColor={authDark.accent}
              autoComplete="email"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="send"
              onSubmitEditing={submit}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
            />
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable
              style={[styles.btn, busy ? styles.btnDisabled : null]}
              onPress={submit}
              disabled={busy}
              accessibilityRole="button">
              <Text style={styles.btnText}>{texts.sendCode}</Text>
            </Pressable>
          </View>
        </ScrollView>

        <Pressable
          onPress={onBack}
          hitSlop={sm.authBackHitSlop}
          style={[styles.back, {top: insets.top + 8}]}
          accessibilityRole="button"
          accessibilityLabel="Retour">
          <ArrowLeft size={sm.authBackIconSize} color={authDark.backIcon} />
        </Pressable>
      </KeyboardAvoidingView>
    </AuthBackground>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: authMetrics.bodyPaddingH,
  },
  center: {width: '100%'},
  back: {
    position: 'absolute',
    left: sm.authPadH,
    width: sm.backBtnSize,
    height: sm.backBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    textAlign: 'center',
    fontSize: 28,
    fontWeight: '700',
    color: authDark.title,
    marginBottom: 10,
  },
  help: {
    textAlign: 'center',
    color: authDark.help,
    fontSize: authMetrics.helpSize,
    lineHeight: 21,
    marginBottom: 28,
  },
  field: {
    borderBottomWidth: 1.5,
    paddingVertical: authMetrics.fieldPaddingV,
    paddingHorizontal: authMetrics.fieldPaddingH,
    fontSize: authMetrics.fieldFontSize,
    color: authDark.text,
  },
  error: {color: authDark.danger, marginTop: 12, textAlign: 'center'},
  btn: {
    marginTop: 32,
    height: welcomeMetrics.buttonHeight,
    borderRadius: welcomeMetrics.buttonRadius,
    backgroundColor: authDark.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: authDark.buttonShadow,
    shadowOpacity: 1,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 6,
  },
  btnText: {color: authDark.buttonText, fontWeight: '600', fontSize: welcomeMetrics.buttonFontSize},
  // opacity 0.6 — état busy (Auth.css)
  btnDisabled: {opacity: 0.6},
});
