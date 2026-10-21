/**
 * Wrappers de navigation du parcours d'association.
 * reset() à la sortie du parcours (beforeRemove hors écrans Associate*).
 */
import React, {useCallback, useEffect} from 'react';
import {AssociateIntroScreen} from './screens/AssociateIntroScreen';
import {AssociateReadyScreen} from './screens/AssociateReadyScreen';
import {AssociateTokenScreen} from './screens/AssociateTokenScreen';
import {AssociateVerifyScreen} from './screens/AssociateVerifyScreen';
import {AssociateConfirmScreen} from './screens/AssociateConfirmScreen';
import {AssociateDoneScreen} from './screens/AssociateDoneScreen';
import {
  useAssociateStore,
  type VerifyResult,
} from './store/associateStore';

const ASSOCIATE_ROUTES = new Set([
  'AssociateIntro',
  'AssociateReady',
  'AssociateToken',
  'AssociateVerify',
  'AssociateConfirm',
  'AssociateDone',
]);

type Nav = {
  goBack: () => void;
  navigate: (name: string, params?: object) => void;
  replace?: (name: string, params?: object) => void;
  popToTop?: () => void;
  addListener?: (
    event: string,
    cb: (e: {data?: {action?: {type?: string; payload?: {name?: string}}}}) => void,
  ) => () => void;
};

/** reset quand on quitte le parcours vers AddBot / Tabs / etc. */
function useResetOnLeaveFlow(navigation: Nav): void {
  const reset = useAssociateStore(s => s.reset);
  useEffect(() => {
    if (!navigation.addListener) {
      return;
    }
    return navigation.addListener('beforeRemove', e => {
      const target = e.data?.action?.payload?.name;
      if (target && ASSOCIATE_ROUTES.has(target)) {
        return;
      }
      reset();
    });
  }, [navigation, reset]);
}

export function AssociateIntroWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  useResetOnLeaveFlow(navigation);
  return (
    <AssociateIntroScreen
      onBack={() => {
        useAssociateStore.getState().reset();
        navigation.goBack();
      }}
      onNext={() => navigation.navigate('AssociateReady')}
    />
  );
}

export function AssociateReadyWrapper({
  navigation,
}: {
  navigation: Nav;
}): React.JSX.Element {
  useResetOnLeaveFlow(navigation);
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
  useResetOnLeaveFlow(navigation);
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
  useResetOnLeaveFlow(navigation);
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
  useResetOnLeaveFlow(navigation);
  const onNeedToken = useCallback(() => {
    if (navigation.replace) {
      navigation.replace('AssociateToken');
    } else {
      navigation.navigate('AssociateToken');
    }
  }, [navigation]);
  return (
    <AssociateConfirmScreen
      onBack={() => navigation.goBack()}
      onDone={() => navigation.navigate('AssociateDone')}
      onNeedToken={onNeedToken}
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
        useAssociateStore.getState().reset();
        if (navigation.popToTop) {
          navigation.popToTop();
        } else {
          navigation.navigate('Tabs');
        }
      }}
    />
  );
}
