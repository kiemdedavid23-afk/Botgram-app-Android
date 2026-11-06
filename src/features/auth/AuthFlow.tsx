/**
 * Parcours de connexion / inscription (non connecté) :
 * accueil → e-mail → code → [type de compte → profil] si l'adresse est inconnue.
 */
import React, {useState} from 'react';
import {View, Text, StyleSheet} from 'react-native';
import type {AccountType} from '../../core/api/endpoints/auth';
import {authColors} from '../../shared/theme/authColors';
import {rootNavigatorMetrics as rm} from '../../shared/theme';
import {ACCOUNT_TYPES} from '../accounts';
import {useAuthStore} from './store/authStore';
import {texts} from './texts';
import {WelcomeScreen} from './screens/WelcomeScreen';
import {EmailScreen} from './screens/EmailScreen';
import {CodeScreen} from './screens/CodeScreen';
import {AccountTypeScreen} from './screens/AccountTypeScreen';
import {ProfileScreen} from './screens/ProfileScreen';

type Step = 'welcome' | 'email' | 'code' | 'type' | 'profile';

export function AuthFlow(): React.JSX.Element {
  const [step, setStep] = useState<Step>('welcome');
  const [email, setEmail] = useState('');
  const [expires, setExpires] = useState(360);
  const [offered, setOffered] = useState<AccountType[]>([...ACCOUNT_TYPES]);
  const [accountType, setAccountType] = useState<AccountType>('personal');
  const setStoreEmail = useAuthStore(s => s.setEmail);
  const setPendingCode = useAuthStore(s => s.setPendingCode);
  const pendingCode = useAuthStore(s => s.pendingCode);
  const endReason = useAuthStore(s => s.endReason);

  if (step === 'welcome') {
    return (
      <View style={styles.flex}>
        {endReason ? (
          <View style={[styles.banner, {backgroundColor: authColors.bg}]}>
            <Text style={[styles.bannerText, {color: authColors.danger}]}>
              {endReason === 'revoked'
                ? 'Session révoquée'
                : endReason === 'access_removed'
                ? texts.accessRemoved
                : 'Session expirée'}
            </Text>
          </View>
        ) : null}
        <WelcomeScreen onContinue={() => setStep('email')} />
      </View>
    );
  }

  if (step === 'email') {
    return (
      <EmailScreen
        onSent={(e, exp) => {
          setEmail(e);
          setExpires(exp);
          setStoreEmail(e);
          setStep('code');
        }}
        onBack={() => setStep('welcome')}
      />
    );
  }

  if (step === 'code') {
    return (
      <CodeScreen
        email={email}
        expiresIn={expires}
        onNeedsProfile={types => {
          setOffered(types);
          setAccountType(
            types.includes('personal') ? 'personal' : types[0] ?? 'personal',
          );
          setStep('type');
        }}
        onSuccess={() => {}}
        onBack={() => setStep('email')}
      />
    );
  }

  if (step === 'type') {
    return (
      <AccountTypeScreen
        offered={offered}
        initial={accountType}
        onChoose={t => {
          setAccountType(t);
          setStep('profile');
        }}
        onBack={() => setStep('code')}
      />
    );
  }

  return (
    <ProfileScreen
      email={email}
      code={pendingCode ?? ''}
      accountType={accountType}
      onSuccess={() => {}}
      onBack={() => setStep('type')}
      onRestart={() => {
        setPendingCode(null);
        setStep('email');
      }}
    />
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  banner: {padding: rm.bannerPadding},
  bannerText: {textAlign: 'center'},
});
