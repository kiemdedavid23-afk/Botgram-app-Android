import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {usePushLifecycle} from '../src/app/usePushLifecycle';
import {usePushTargetStore} from '../src/app/pushTargetStore';
import {useAuthStore} from '../src/features/auth/store/authStore';
import {useBotsStore} from '../src/features/bots/store/botsStore';
import {useOpenRequestStore} from '../src/features/conversations/store/openRequestStore';
import {navigationRef} from '../src/app/navigationRef';
import * as push from '../src/core/push';

jest.mock('../src/core/push', () => ({
  getLaunchPush: jest.fn(async () => null),
  onForegroundPush: jest.fn(() => jest.fn()),
  onPushOpened: jest.fn(() => jest.fn()),
  setupPush: jest.fn(async () => true),
  subscribeTopic: jest.fn(async () => undefined),
  updatesTopic: (c: string) => `app-update-android-${c}`,
  watchTokenRefresh: jest.fn(() => jest.fn()),
  unregisterPush: jest.fn(async () => undefined),
}));
jest.mock('../src/app/navigationRef', () => ({
  navigationRef: {isReady: jest.fn(() => true), navigate: jest.fn()},
}));

const p = push as jest.Mocked<typeof push>;
const nav = navigationRef as unknown as {
  isReady: jest.Mock;
  navigate: jest.Mock;
};

function Probe(): null {
  usePushLifecycle();
  return null;
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(React.createElement(Probe));
  });
  return tree;
}

const bot = (id: string, selected: boolean) =>
  ({id, name: id, selected}) as never;

describe('usePushLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    nav.isReady.mockReturnValue(true);
    useAuthStore.setState({state: 'signedIn'});
    useBotsStore.setState({bots: [bot('b1', true)]});
    usePushTargetStore.setState({target: null});
    useOpenRequestStore.setState({pendingThreadId: null});
  });

  it('s’abonne au topic des mises à jour et enregistre le jeton', async () => {
    await mount();
    expect(p.subscribeTopic).toHaveBeenCalledWith('app-update-android-direct');
    expect(p.setupPush).toHaveBeenCalledTimes(1);
  });

  it('déconnecté ou sans bot : pas d’enregistrement de jeton', async () => {
    useAuthStore.setState({state: 'signedOut'});
    await mount();
    expect(p.setupPush).not.toHaveBeenCalled();
    useAuthStore.setState({state: 'signedIn'});
    useBotsStore.setState({bots: []});
    await mount();
    expect(p.setupPush).not.toHaveBeenCalled();
  });

  it('notification touchée : demande le fil et ouvre l’espace bot', async () => {
    await mount();
    await act(async () => {
      usePushTargetStore.getState().setTarget({
        kind: 'message',
        botId: 'b1',
        conversationId: 'c9',
      });
    });
    expect(useOpenRequestStore.getState().pendingThreadId).toBe('c9');
    expect(nav.navigate).toHaveBeenCalledWith('BotSpace');
    expect(usePushTargetStore.getState().target).toBeNull();
  });

  it('navigation pas prête : la cible reste en attente', async () => {
    nav.isReady.mockReturnValue(false);
    await mount();
    await act(async () => {
      usePushTargetStore.getState().setTarget({
        kind: 'message',
        botId: 'b1',
        conversationId: 'c9',
      });
    });
    expect(nav.navigate).not.toHaveBeenCalled();
    expect(usePushTargetStore.getState().target).not.toBeNull();
  });
});
