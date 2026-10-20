/**
 * Navigation racine — booting / auth / shell / upgrade.
 * ShellSwitcher uniquement sous __DEV__.
 */
import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTheme} from '../shared/theme';
import {useAuthStore} from '../features/auth/store/authStore';
import {WelcomeScreen} from '../features/auth/screens/WelcomeScreen';
import {EmailScreen} from '../features/auth/screens/EmailScreen';
import {CodeScreen} from '../features/auth/screens/CodeScreen';
import {ProfileScreen} from '../features/auth/screens/ProfileScreen';
import {AccountDisabledScreen} from '../features/auth/screens/AccountDisabledScreen';
import {UpgradeScreen} from '../features/auth/screens/UpgradeScreen';
import {authColors} from '../shared/theme/authColors';
import {BrandBar} from '../shared/components/BrandBar';
import {EmptyScreen} from '../shared/components/EmptyScreen';
import {BottomNav, type MemberTabId} from '../shared/components/BottomNav';
import {Pressable, Text} from 'react-native';

function Booting(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.bgSecondary}}>
      <ActivityIndicator color={colors.accent} />
    </View>
  );
}

function AuthFlow(): React.JSX.Element {
  const [step, setStep] = useState<'welcome' | 'email' | 'code' | 'profile'>('welcome');
  const [email, setEmail] = useState('');
  const [expires, setExpires] = useState(360);
  const setStoreEmail = useAuthStore(s => s.setEmail);
  const pendingCode = useAuthStore(s => s.pendingCode);
  const endReason = useAuthStore(s => s.endReason);

  if (step === 'welcome') {
    return (
      <View style={{flex: 1}}>
        {endReason ? (
          <View style={{padding: 12, backgroundColor: authColors.bg}}>
            <Text style={{color: authColors.danger, textAlign: 'center'}}>
              {endReason === 'revoked' ? 'Session révoquée' : 'Session expirée'}
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
        onNeedsProfile={() => setStep('profile')}
        onSuccess={() => {}}
        onBack={() => setStep('email')}
      />
    );
  }
  return <ProfileScreen email={email} code={pendingCode ?? ''} onSuccess={() => {}} onBack={() => setStep('code')} />;
}

function MemberShell(): React.JSX.Element {
  const {colors} = useTheme();
  const [tab, setTab] = useState<MemberTabId>('dashboard');
  const signOut = useAuthStore(s => s.signOut);
  const offline = useAuthStore(s => s.offline);

  return (
    <View style={{flex: 1, backgroundColor: colors.bgSecondary}}>
      <BrandBar title="Botgram" />
      {offline ? (
        <View style={{padding: 12, backgroundColor: colors.bgTertiary}}>
          <Text style={{color: colors.textSecondary, textAlign: 'center'}}>Hors ligne</Text>
        </View>
      ) : null}
      <EmptyScreen title={tab === 'settings' ? 'Paramètres' : 'Tableau de bord'} subtitle="Étape 2 — auth" />
      {tab === 'settings' ? (
        <Pressable
          onPress={() => signOut()}
          style={{marginHorizontal: 22, marginTop: 16, paddingVertical: 14, backgroundColor: colors.bgTertiary, borderRadius: 12, alignItems: 'center'}}>
          <Text style={{color: colors.danger, fontSize: 16, fontWeight: '600'}}>Se déconnecter</Text>
        </Pressable>
      ) : null}
      <BottomNav activeTab={tab} onTabPress={setTab} />
    </View>
  );
}

export function RootNavigator(): React.JSX.Element {
  const {colors, mode} = useTheme();
  const state = useAuthStore(s => s.state);
  const boot = useAuthStore(s => s.boot);

  useEffect(() => {
    void boot();
  }, [boot]);

  const navTheme = {
    ...(mode === 'dark' ? DarkTheme : DefaultTheme),
    colors: {
      ...(mode === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
      background: colors.bgSecondary,
      card: colors.bgPrimary,
      text: colors.textPrimary,
      border: colors.border,
      primary: colors.accent,
    },
  };

  let content: React.JSX.Element;
  if (state === 'booting') content = <Booting />;
  else if (state === 'upgradeRequired') content = <UpgradeScreen />;
  else if (state === 'accountDisabled') content = <AccountDisabledScreen />;
  else if (state === 'signedIn') content = <MemberShell />;
  else content = <AuthFlow />;

  let devBanner: React.JSX.Element | null = null;
  if (__DEV__ && state === 'signedIn') {
    const Switcher = require('./dev/ShellSwitcher').ShellSwitcher as React.ComponentType;
    devBanner = <Switcher />;
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={navTheme}>
        {devBanner}
        {content}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
