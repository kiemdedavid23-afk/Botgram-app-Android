/**
 * Partie 0 — branchement transport ↔ auth (R1, R2) + resync / unread hors écran.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {useRealtimeLifecycle} from '../src/app/useRealtimeLifecycle';
import {useAuthStore} from '../src/features/auth/store/authStore';
import {useConversationsStore} from '../src/features/conversations/store/conversationsStore';

const mockStart = jest.fn();
const mockStop = jest.fn();
type SubEv = {
  type: string;
  scopes?: string[];
  [key: string]: unknown;
};
let subscribedHandler: ((ev: SubEv) => void) | null = null;
const mockUnsub = jest.fn();
const mockSubscribe = jest.fn((h: (ev: SubEv) => void) => {
  subscribedHandler = h;
  return mockUnsub;
});

jest.mock('../src/core/realtime', () => ({
  getRealtimeTransport: () => ({
    start: mockStart,
    stop: mockStop,
    subscribe: mockSubscribe,
    getConnectionState: () => 'idle',
  }),
}));

const mockApplySignedOut = jest.fn((_reason?: string | null) =>
  Promise.resolve(),
);

jest.mock('../src/features/auth/store/authStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    state: 'booting' as
      | 'booting'
      | 'signedOut'
      | 'signedIn'
      | 'upgradeRequired'
      | 'accountDisabled',
    member: null,
    offline: false,
    endReason: null,
    upgradeLatest: null,
    email: null,
    pendingCode: null,
  }));
  return {
    useAuthStore: store,
    applySignedOut: (reason?: string | null) => mockApplySignedOut(reason),
  };
});

const mockBotsLoad = jest.fn(() => Promise.resolve());

jest.mock('../src/features/bots/store/botsStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    bots: [] as Array<{id: string; selected: boolean}>,
    load: mockBotsLoad,
  }));
  return {useBotsStore: store};
});

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

jest.mock('../src/core/api/endpoints/conversations', () => ({
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  searchConversations: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() => Promise.resolve(undefined)),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDelete: jest.fn(() => Promise.resolve()),
  cacheDeleteByPrefix: jest.fn(() => Promise.resolve()),
}));

function Harness(): null {
  useRealtimeLifecycle();
  return null;
}

describe('useRealtimeLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribedHandler = null;
    act(() => {
      useAuthStore.setState({
        state: 'booting',
        member: null,
        offline: false,
        endReason: null,
        upgradeLatest: null,
        email: null,
        pendingCode: null,
      });
      useConversationsStore.getState().clear();
    });
  });

  it('démarre le transport quand state === signedIn', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    expect(mockStart).toHaveBeenCalled();
  });

  it('arrête le transport pour signedOut', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(Harness));
    });
    expect(mockStart).toHaveBeenCalled();
    act(() => {
      useAuthStore.setState({state: 'signedOut'});
      tree!.update(React.createElement(Harness));
    });
    expect(mockStop).toHaveBeenCalled();
  });

  it('session.revoked appelle applySignedOut(revoked)', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    expect(mockSubscribe).toHaveBeenCalled();
    expect(subscribedHandler).not.toBeNull();
    act(() => {
      subscribedHandler?.({type: 'session.revoked'});
    });
    expect(mockApplySignedOut).toHaveBeenCalledWith('revoked');
  });

  it('resync bots appelle botsStore.load(true)', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    act(() => {
      subscribedHandler?.({
        type: 'resync',
        scopes: ['bots', 'conversations'],
      });
    });
    expect(mockBotsLoad).toHaveBeenCalledWith(true);
  });

  it('message.new hors écran incrémente unreadTotal', () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
      useConversationsStore.setState({
        botId: 'bot1',
        items: [
          {
            id: 'c1',
            bot_id: 'bot1',
            unread_count: 0,
            last_message_at: 1,
          },
        ],
        unreadTotal: 0,
      });
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    act(() => {
      subscribedHandler?.({
        type: 'message.new',
        id: 'e1',
        at: 1,
        bot_id: 'bot1',
        conversation_id: 'c1',
        message_id: 'm1',
        direction: 'in',
        kind: 'text',
        conversation: {
          id: 'c1',
          bot_id: 'bot1',
          unread_count: 2,
          last_message_at: 2,
        },
      });
    });
    expect(useConversationsStore.getState().unreadTotal).toBe(2);
  });
});
