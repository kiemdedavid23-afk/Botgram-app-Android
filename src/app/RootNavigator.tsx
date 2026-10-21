/**
 * Navigation racine — booting / auth / shell / upgrade.
 * ShellSwitcher uniquement sous __DEV__.
 */
import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, Text, StyleSheet} from 'react-native';
import {NavigationContainer, DefaultTheme, DarkTheme} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTheme, space, fontSize, fontWeight, radii} from '../shared/theme';
import {useAuthStore} from '../features/auth/store/authStore';
import {fireAndForget} from '../core/utils/fireAndForget';
import {WelcomeScreen} from '../features/auth/screens/WelcomeScreen';
import {EmailScreen} from '../features/auth/screens/EmailScreen';
import {CodeScreen} from '../features/auth/screens/CodeScreen';
import {ProfileScreen} from '../features/auth/screens/ProfileScreen';
import {AccountDisabledScreen} from '../features/auth/screens/AccountDisabledScreen';
import {UpgradeScreen} from '../features/auth/screens/UpgradeScreen';
import {authColors} from '../shared/theme/authColors';
import {BrandBar} from '../shared/components/BrandBar';
import {BottomNav, type MemberTabId} from '../shared/components/BottomNav';
import {DashboardScreen} from '../features/dashboard/screens/DashboardScreen';
import {AddBotScreen} from '../features/bots/screens/AddBotScreen';
import {MemberProfileScreen} from '../features/member';
import {MemberSettingsScreen} from '../features/settings';
import {GestionScreen} from '../features/gestion';
import {
  AssociateIntroWrapper,
  AssociateReadyWrapper,
  AssociateTokenWrapper,
  AssociateVerifyWrapper,
  AssociateConfirmWrapper,
  AssociateDoneWrapper,
} from '../features/associate/AssociateStackScreens';
import type {VerifyResult} from '../features/associate';

function Booting(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.flexCenter, {backgroundColor: colors.bgSecondary}]}>
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
      <View style={styles.flex}>
        {endReason ? (
          <View style={[styles.banner, {backgroundColor: authColors.bg}]}>
            <Text style={[styles.bannerText, {color: authColors.danger}]}>
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

export type MemberStackParamList = {
  Tabs: undefined;
  AddBot: undefined;
  Gestion: undefined;
  AssociateIntro: undefined;
  AssociateReady: undefined;
  AssociateToken: undefined;
  AssociateVerify: {result: VerifyResult};
  AssociateConfirm: undefined;
  AssociateDone: undefined;
};

const MemberStack = createNativeStackNavigator<MemberStackParamList>();

function MemberTabs({
  navigation,
}: {
  navigation: {navigate: (name: 'AddBot' | 'Gestion') => void};
}): React.JSX.Element {
  const {colors} = useTheme();
  const [tab, setTab] = useState<MemberTabId>('dashboard');
  const offline = useAuthStore(s => s.offline);

  return (
    <View style={[styles.flex, {backgroundColor: colors.bgSecondary}]}>
      <BrandBar title="Botgram" />
      {offline ? (
        <View style={[styles.banner, {backgroundColor: colors.bgTertiary}]}>
          <Text style={[styles.bannerText, {color: colors.textSecondary}]}>
            Hors ligne
          </Text>
        </View>
      ) : null}
      {tab === 'dashboard' ? (
        <DashboardScreen onAddBot={() => navigation.navigate('AddBot')} />
      ) : tab === 'settings' ? (
        <MemberSettingsScreen
          onGoProfile={() => setTab('member')}
          onGoGestion={() => navigation.navigate('Gestion')}
        />
      ) : (
        <MemberProfileScreen onGoDashboard={() => setTab('dashboard')} />
      )}
      <BottomNav activeTab={tab} onTabPress={setTab} />
    </View>
  );
}

function MemberShell(): React.JSX.Element {
  return (
    <MemberStack.Navigator screenOptions={{headerShown: false}}>
      <MemberStack.Screen name="Tabs" component={MemberTabs} />
      <MemberStack.Screen name="AddBot" component={AddBotScreenWrapper} />
      <MemberStack.Screen name="Gestion" component={GestionScreen} />
      <MemberStack.Screen
        name="AssociateIntro"
        component={AssociateIntroWrapper}
      />
      <MemberStack.Screen
        name="AssociateReady"
        component={AssociateReadyWrapper}
      />
      <MemberStack.Screen
        name="AssociateToken"
        component={AssociateTokenWrapper}
      />
      <MemberStack.Screen
        name="AssociateVerify"
        component={AssociateVerifyWrapper}
      />
      <MemberStack.Screen
        name="AssociateConfirm"
        component={AssociateConfirmWrapper}
      />
      <MemberStack.Screen
        name="AssociateDone"
        component={AssociateDoneWrapper}
      />
    </MemberStack.Navigator>
  );
}

function AddBotScreenWrapper({
  navigation,
}: {
  navigation: {
    goBack: () => void;
    navigate: (name: 'AssociateIntro') => void;
  };
}): React.JSX.Element {
  return (
    <AddBotScreen
      onBack={() => navigation.goBack()}
      onAssociate={() => navigation.navigate('AssociateIntro')}
    />
  );
}

export function RootNavigator(): React.JSX.Element {
  const {colors, mode} = useTheme();
  const state = useAuthStore(s => s.state);
  const boot = useAuthStore(s => s.boot);

  useEffect(() => {
    fireAndForget(boot());
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

const styles = StyleSheet.create({
  // flex:1 — conteneur racine plein écran (layout RN standard)
  flex: {flex: 1},
  // centrage booting (ActivityIndicator)
  flexCenter: {flex: 1, justifyContent: 'center', alignItems: 'center'},
  // padding 12 — bandeau hors-ligne / fin de session (proche sheet section padding 0 14 6, Design tokens §5)
  banner: {padding: 12},
  bannerText: {textAlign: 'center'},
  // marginHorizontal 22 = authMetrics.bodyPaddingH (Auth.css body) ; paddingVertical 14 ≈ fieldPaddingV ; borderRadius 12 = radii.md (Design tokens §3 md 12)
  logoutBtn: {
    marginHorizontal: 22,
    marginTop: space.md,
    paddingVertical: 14,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  // fontSize 16 = fontSize.msgDefault ; fontWeight 600 = fontWeight.semibold (Design tokens §4)
  logoutText: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
});
