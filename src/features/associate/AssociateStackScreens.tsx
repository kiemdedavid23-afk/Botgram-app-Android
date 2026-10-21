/**
 * Wrappers de navigation du parcours d'association.
 * Emplacement : features/associate/AssociateStackScreens.tsx
 * Importé par app/RootNavigator via ../features/associate/AssociateStackScreens
 */
import React from 'react';
import {AssociateIntroScreen} from './screens/AssociateIntroScreen';
import {AssociateReadyScreen} from './screens/AssociateReadyScreen';
import {AssociateTokenScreen} from './screens/AssociateTokenScreen';
import {AssociateVerifyScreen} from './screens/AssociateVerifyScreen';
import {AssociateConfirmScreen} from './screens/AssociateConfirmScreen';
import {AssociateDoneScreen} from './screens/AssociateDoneScreen';
import type {VerifyResult} from './store/associateStore';

type Nav = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
  popToTop?: () => void;
};

export function AssociateIntroWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  return (
    <AssociateIntroScreen
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('AssociateReady')}
    />
  );
}

export function AssociateReadyWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  return (
    <AssociateReadyScreen
      onBack={() => navigation.goBack()}
      onNext={() => navigation.navigate('AssociateToken')}
    />
  );
}

export function AssociateTokenWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  return (
    <AssociateTokenScreen
      onBack={() => navigation.goBack()}
      onVerified={result =>
        navigation.navigate('AssociateVerify', {result})
      }
    />
  );
}

export function AssociateVerifyWrapper({
  navigation,
  route,
}: {
  navigation: Nav;
  route: {params: {result: VerifyResult}};
}): React.JSX.Element {
  return (
    <AssociateVerifyScreen
      result={route.params.result}
      onBack={() => navigation.goBack()}
      onConfirm={() => navigation.navigate('AssociateConfirm')}
      onBackToken={() => navigation.navigate('AssociateToken')}
    />
  );
}

export function AssociateConfirmWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  return (
    <AssociateConfirmScreen
      onBack={() => navigation.goBack()}
      onDone={() => navigation.navigate('AssociateDone')}
    />
  );
}

export function AssociateDoneWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  return (
    <AssociateDoneScreen
      onHome={() => {
        if (navigation.popToTop) {
          navigation.popToTop();
        } else {
          navigation.navigate('Tabs');
        }
      }}
    />
  );
}
