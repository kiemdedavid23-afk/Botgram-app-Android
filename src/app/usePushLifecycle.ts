/**
 * Notifications push (étape 8) : enregistrement du jeton, topic des mises à
 * jour, réception application ouverte, toucher sur une notification.
 * Application ouverte : le temps réel (WebSocket / sondage) remonte déjà les
 * messages ; au retour au premier plan, le rattrapage /updates se fait seul.
 */
import {useEffect} from 'react';
import {
  getLaunchPush,
  onForegroundPush,
  onPushOpened,
  setupPush,
  subscribeTopic,
  updatesTopic,
  watchTokenRefresh,
} from '../core/push';
import {env} from '../core/config/env';
import {fireAndForget} from '../core/utils/fireAndForget';
import {useAuthStore} from '../features/auth/store/authStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {useUpdateStore} from '../features/update/updateStore';
import {useOpenRequestStore} from '../features/conversations/store/openRequestStore';
import {navigationRef} from './navigationRef';
import {usePushTargetStore} from './pushTargetStore';

export function usePushLifecycle(): void {
  const authState = useAuthStore(s => s.state);
  const bots = useBotsStore(s => s.bots);
  const target = usePushTargetStore(s => s.target);
  const setTarget = usePushTargetStore(s => s.setTarget);
  const hasBots = bots.length > 0;

  // Topic des mises à jour + écoute des notifications (une fois).
  useEffect(() => {
    fireAndForget(subscribeTopic(updatesTopic(env.appChannel)));
    fireAndForget(
      getLaunchPush().then(p => {
        if (p?.kind === 'message') setTarget(p);
      }),
    );
    const offForeground = onForegroundPush(p => {
      if (p.kind === 'app_update') {
        fireAndForget(useUpdateStore.getState().check());
      }
    });
    const offOpened = onPushOpened(p => {
      if (p.kind === 'message') setTarget(p);
      if (p.kind === 'app_update') {
        fireAndForget(useUpdateStore.getState().check(true));
      }
    });
    return () => {
      offForeground();
      offOpened();
    };
  }, [setTarget]);

  // Jeton : après la connexion et le premier bot (permission demandée alors).
  useEffect(() => {
    if (authState !== 'signedIn' || !hasBots) return undefined;
    fireAndForget(setupPush());
    return watchTokenRefresh();
  }, [authState, hasBots]);

  // Toucher sur une notification de message : bot, espace bot, fil.
  useEffect(() => {
    if (!target || authState !== 'signedIn' || !hasBots) return;
    if (!navigationRef.isReady()) return;
    setTarget(null);
    const run = async (): Promise<void> => {
      const store = useBotsStore.getState();
      const known = store.bots.find(b => b.id === target.botId);
      if (known && !known.selected) await store.select(known.id);
      if (target.conversationId) {
        useOpenRequestStore.getState().requestThread(target.conversationId);
      }
      navigationRef.navigate('BotSpace');
    };
    fireAndForget(run());
  }, [target, authState, hasBots, setTarget]);
}
