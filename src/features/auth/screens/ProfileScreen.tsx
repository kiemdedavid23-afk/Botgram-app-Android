/**
 * Dernière étape d'inscription : profil, puis champs du type de compte choisi.
 * Une seule requête finale (/auth/code/verify) avec le code reçu à l'étape 2,
 * tant qu'il vaut encore (6 minutes).
 */
import React, {useCallback, useState} from 'react';
import {View, Text, Pressable} from 'react-native';
import {verifyCode, type AccountType} from '../../../core/api/endpoints/auth';
import {texts} from '../texts';
import {useAuthStore} from '../store/authStore';
import {AuthLightScaffold} from '../components/AuthLightScaffold';
import {CountrySheet} from '../components/CountrySheet';
import {IdentityFields} from '../components/IdentityFields';
import {
  CompanyFields,
  InviteFields,
  PersonalFields,
} from '../components/AccountFields';
import {formStyles as s} from '../components/formStyles';
import {
  EMPTY_FORM,
  buildVerifyParams,
  describeSignupError,
  dialOf,
  isCodeStale,
  reasonsToMessages,
  validateSignup,
  type SignupForm,
} from '../utils/signup';

type Props = {
  email: string;
  code: string;
  accountType: AccountType;
  onSuccess: () => void;
  onBack: () => void;
  /** Code périmé ou refusé : retour à la demande d'un nouveau code. */
  onRestart: () => void;
};

const HEADERS: Record<
  AccountType,
  {emoji: string; title: string; sub: string}
> = {
  personal: {
    emoji: '🎉',
    title: texts.profileHeadline,
    sub: texts.profileSub,
  },
  company: {
    emoji: '🏢',
    title: texts.profileCompanyHeadline,
    sub: texts.profileCompanySub,
  },
  invited: {
    emoji: '✉️',
    title: texts.profileInvitedHeadline,
    sub: texts.profileInvitedSub,
  },
};

export function ProfileScreen({
  email,
  code,
  accountType,
  onSuccess,
  onBack,
  onRestart,
}: Props): React.JSX.Element {
  const [form, setForm] = useState<SignupForm>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [restart, setRestart] = useState(false);
  const [focus, setFocus] = useState<string | null>(null);
  const [countryOpen, setCountryOpen] = useState(false);
  const completeVerify = useAuthStore(st => st.completeVerify);
  const setPendingCode = useAuthStore(st => st.setPendingCode);
  const pendingCodeAt = useAuthStore(st => st.pendingCodeAt);

  const dial = dialOf(form.country);
  const patch = useCallback(
    (p: Partial<SignupForm>) => setForm(f => ({...f, ...p})),
    [],
  );

  const submit = async () => {
    if (busy || restart) return;
    if (isCodeStale(pendingCodeAt, Date.now())) {
      setRestart(true);
      setError(texts.codeExpired);
      return;
    }
    const local = validateSignup(accountType, form, dial);
    if (Object.keys(local).length > 0) {
      setErrors(reasonsToMessages(local));
      setError(texts.checkFields);
      return;
    }
    setBusy(true);
    setError('');
    setErrors({});
    const res = await verifyCode(
      buildVerifyParams(accountType, email, code, form, dial),
    );
    setBusy(false);
    if (res.ok) {
      if ('needs_profile' in res.data) {
        setError(texts.incompleteProfile);
        return;
      }
      setPendingCode(null);
      await completeVerify(res.data);
      // Adresse devenue inscrite entre-temps : le Worker ignore l'invitation, sans erreur.
      if (accountType === 'invited' && !res.data.is_new) {
        useAuthStore.getState().setInviteUnused(true);
      }
      onSuccess();
      return;
    }
    const failure = describeSignupError(
      res.error.code,
      res.error.message,
      res.error.details,
      res.headers.get('retry-after'),
    );
    setError(failure.message);
    if (failure.kind === 'fields') setErrors(failure.fields);
    if (failure.kind === 'restart') setRestart(true);
  };

  const head = HEADERS[accountType];
  const fieldProps = {form, patch, errors, focus, setFocus, dial};

  return (
    <AuthLightScaffold step={4} onBack={onBack}>
      <View style={s.badge}>
        <Text style={s.badgeEmoji}>{head.emoji}</Text>
      </View>
      <Text style={s.title} accessibilityRole="header">
        {head.title}
      </Text>
      <Text style={s.sub}>{head.sub}</Text>

      {accountType === 'invited' ? <InviteFields {...fieldProps} /> : null}
      <IdentityFields
        {...fieldProps}
        onOpenCountry={() => setCountryOpen(true)}
      />
      {accountType === 'personal' ? <PersonalFields {...fieldProps} /> : null}
      {accountType === 'company' ? <CompanyFields {...fieldProps} /> : null}

      {error ? (
        <View style={s.errorBox}>
          <Text style={s.error}>⚠️ {error}</Text>
        </View>
      ) : null}

      {restart ? (
        <Pressable
          style={s.btn}
          onPress={onRestart}
          accessibilityRole="button">
          <Text style={s.btnText}>{texts.restartCode}</Text>
        </Pressable>
      ) : (
        <Pressable
          style={[s.btn, busy ? s.btnDisabled : null]}
          onPress={submit}
          disabled={busy}
          accessibilityRole="button">
          <Text style={s.btnText}>
            {busy ? texts.finishBusy : `${texts.finish} 🚀`}
          </Text>
        </Pressable>
      )}

      <CountrySheet
        visible={countryOpen}
        selected={form.country}
        onSelect={c => {
          patch({country: c});
          setCountryOpen(false);
        }}
        onClose={() => setCountryOpen(false)}
      />
    </AuthLightScaffold>
  );
}
