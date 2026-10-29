/**
 * Navigation racine — booting / auth / shell / upgrade.
 * Espace membre : en-tête avatar + menu ⋮ (Tableau de bord / Profil / Gestion).
 * Espace bot (BotSpace) : depuis le tableau de bord ou la feuille de bascule.
 * ShellSwitcher uniquement sous __DEV__.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  BackHandler,
} from 'react-native';
import {
  NavigationContainer,
  DefaultTheme,
  DarkTheme,
  useFocusEffect,
} from '@react-navigation/native';
import {LayoutDashboard, UserRound, Settings} from 'lucide-react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {useTheme, space, fontSize, fontWeight, radii, rootNavigatorMetrics as rm} from '../shared/theme';
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
import {HeaderAvatarButton} from '../shared/components/HeaderAvatarButton';
import {
  HeaderMenu,
  type HeaderMenuItem,
} from '../shared/components/HeaderMenu';
import {DashboardScreen} from '../features/dashboard/screens/DashboardScreen';
import {AddBotScreen} from '../features/bots/screens/AddBotScreen';
import {MemberProfileScreen} from '../features/member';
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
import {BotSpaceScreen} from './BotSpaceScreen';
import {ContextSwitcher} from './ContextSwitcher';
import {useMemberSectionStore, type MemberSection} from './memberSectionStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {readLastSpace, saveLastSpace} from './lastSpaceStore';

/** Reprise du dernier espace : une seule fois par lancement de l'app. */
let restoreAttempted = false;
/** Ouverture de reprise sans animation (pas de flash du tableau de bord). */
let skipNextAnimation = false;

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
  BotSpace: undefined;
  AssociateIntro: undefined;
  AssociateReady: undefined;
  AssociateToken: undefined;
  AssociateVerify: {result: VerifyResult};
  AssociateConfirm: undefined;
  AssociateDone: undefined;
};

const MemberStack = createNativeStackNavigator<MemberStackParamList>();

const MEMBER_MENU: ReadonlyArray<HeaderMenuItem<MemberSection>> = [
  {id: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard},
  {id: 'member', label: 'Profil', Icon: UserRound},
  {id: 'gestion', label: 'Gestion', Icon: Settings},
];

function MemberTabs({
  navigation,
}: {
  navigation: {navigate: (name: 'AddBot' | 'BotSpace') => void};
}): React.JSX.Element {
  const {colors} = useTheme();
  const section = useMemberSectionStore(st => st.section);
  const setSection = useMemberSectionStore(st => st.setSection);
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const offline = useAuthStore(s => s.offline);
  const member = useAuthStore(s => s.member);

  // Relance de l'app : retour direct dans l'espace bot si c'est là qu'on l'avait quittée.
  // Lecture du cache local seulement : aucune connexion nécessaire.
  useEffect(() => {
    if (restoreAttempted) {
      return;
    }
    restoreAttempted = true;
    fireAndForget(
      (async () => {
        if ((await readLastSpace()) !== 'bot') {
          return;
        }
        await useBotsStore.getState().hydrate();
        if (useBotsStore.getState().bots.length > 0) {
          skipNextAnimation = true;
          navigation.navigate('BotSpace');
        }
      })(),
    );
  }, [navigation]);

  // Au démontage (déconnexion), on repart du Tableau de bord.
  useEffect(() => {
    return () => {
      useMemberSectionStore.getState().setSection('dashboard');
    };
  }, []);

  // Retour Android : Profil / Gestion → Tableau de bord.
  // Actif seulement quand cet écran est au premier plan.
  useFocusEffect(
    useCallback(() => {
      if (section === 'dashboard') {
        return undefined;
      }
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        setSection('dashboard');
        return true;
      });
      return () => {
        sub.remove();
      };
    }, [section, setSection]),
  );

  return (
    <View style={[styles.flex, {backgroundColor: colors.bgSecondary}]}>
      <BrandBar
        title="Botgram"
        right={
          <View style={styles.headerRight}>
            <HeaderAvatarButton
              title={member?.display_name ?? ''}
              open={switcherOpen}
              onPress={() => setSwitcherOpen(true)}
            />
            <HeaderMenu
              items={MEMBER_MENU}
              activeId={section}
              onSelect={setSection}
            />
          </View>
        }
      />
      {offline ? (
        <View style={[styles.banner, {backgroundColor: colors.bgTertiary}]}>
          <Text style={[styles.bannerText, {color: colors.textSecondary}]}>
            Hors ligne
          </Text>
        </View>
      ) : null}
      {section === 'dashboard' ? (
        <DashboardScreen
          onAddBot={() => navigation.navigate('AddBot')}
          onOpenBot={() => navigation.navigate('BotSpace')}
        />
      ) : section === 'member' ? (
        <MemberProfileScreen onGoDashboard={() => setSection('dashboard')} />
      ) : (
        <GestionScreen />
      )}
      <ContextSwitcher
        context="member"
        visible={switcherOpen}
        onClose={() => setSwitcherOpen(false)}
        onSelectMember={() => setSwitcherOpen(false)}
        onBotSelected={() => {
          setSwitcherOpen(false);
          navigation.navigate('BotSpace');
        }}
      />
    </View>
  );
}

function MemberShell(): React.JSX.Element {
  return (
    <MemberStack.Navigator screenOptions={{headerShown: false}}>
      <MemberStack.Screen name="Tabs" component={MemberTabs} />
      <MemberStack.Screen name="AddBot" component={AddBotScreenWrapper} />
      <MemberStack.Screen
        name="BotSpace"
        component={BotSpaceScreenWrapper}
        options={() => ({animation: skipNextAnimation ? 'none' : 'default'})}
      />
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

function BotSpaceScreenWrapper({
  navigation,
}: {
  navigation: {goBack: () => void; navigate: (name: 'AddBot') => void};
}): React.JSX.Element {
  useEffect(() => {
    skipNextAnimation = false;
    saveLastSpace('bot');
    return () => {
      saveLastSpace('member');
    };
  }, []);
  return (
    <BotSpaceScreen
      onExit={() => navigation.goBack()}
      onAddBot={() => navigation.navigate('AddBot')}
    />
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
  // avatar + menu ⋮ à droite de la barre de marque
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  // padding 12 — bandeau hors-ligne / fin de session (proche sheet section padding 0 14 6, Design tokens §5)
  banner: {padding: rm.bannerPadding},
  bannerText: {textAlign: 'center'},
  // marginHorizontal 22 = authMetrics.bodyPaddingH (Auth.css body) ; paddingVertical 14 ≈ fieldPaddingV ; borderRadius 12 = radii.md (Design tokens §3 md 12)
  logoutBtn: {
    marginHorizontal: rm.logoutMarginH,
    marginTop: space.md,
    paddingVertical: rm.logoutPadV,
    borderRadius: radii.md,
    alignItems: 'center',
  },
  // fontSize 16 = fontSize.msgDefault ; fontWeight 600 = fontWeight.semibold (Design tokens §4)
  logoutText: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
});
