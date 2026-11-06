/**
 * Partie 0 — branchement transport ↔ auth (R1, R2) + resync / unread hors écran.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {useRealtimeLifecycle} from '../src/app/useRealtimeLifecycle';
import {useAuthStore} from '../src/features/auth/store/authStore';
import {useConversationsStore} from '../src/features/conversations/store/conversationsStore';
import {useBotsStore} from '../src/features/bots/store/botsStore';
import type {Bot} from '../src/core/api/endpoints/bots';
import {useWorkspaceStore} from '../src/features/accounts/store/workspaceStore';
import {listWorkspaces} from '../src/core/api/endpoints/workspaces';
import {me} from '../src/core/api/endpoints/auth';


function makeBot(overrides: Partial<Bot> = {}): Bot {
  return {
    id: 'bot1',
    telegram_bot_id: 1001,
    username: null,
    name: 'Bot 1',
    status: 'connected',
    selected: false,
    muted: false,
    created_at: 1_700_000_000_000,
    connected_at: 1_700_000_000_000,
    disconnected_at: null,
    ...overrides,
  };
}

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

const mockBotsLoad = jest.fn((_force?: boolean) => Promise.resolve());

jest.mock('../src/features/bots/store/botsStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    bots: [] as Bot[],
    load: (force?: boolean) => mockBotsLoad(force),
  }));
  return {useBotsStore: store};
});

jest.mock('../src/core/api/endpoints/workspaces', () => ({
  listWorkspaces: jest.fn(),
}));

jest.mock('../src/core/api/endpoints/auth', () => ({
  ...jest.requireActual('../src/core/api/endpoints/auth'),
  me: jest.fn(),
}));

const mockListWorkspaces = listWorkspaces as jest.Mock;
const mockMe = me as jest.Mock;

const OFFLINE = {
  ok: false,
  status: 0,
  error: {code: 'network_error', message: 'Erreur réseau'},
  requestId: null,
  headers: new Headers(),
};

function workspacesOk(workspaces: unknown[]) {
  return {
    ok: true,
    status: 200,
    data: {workspaces},
    requestId: null,
    headers: new Headers(),
  };
}

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

jest.mock('../src/features/thread/store/threadStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    conversationId: null as string | null,
    applyRealtimeEvent: jest.fn(),
    close: jest.fn(),
    clear: jest.fn(),
  }));
  return {useThreadStore: store};
});

/** Laisse finir les chargements en arrière-plan (cache, réseau simulé, stores). */
async function flush(): Promise<void> {
  await act(async () => {
    await new Promise<void>(resolve => setTimeout(resolve, 0));
  });
}

function Harness(): null {
  useRealtimeLifecycle();
  return null;
}

describe('useRealtimeLifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    subscribedHandler = null;
    mockListWorkspaces.mockResolvedValue(OFFLINE);
    act(() => {
      useWorkspaceStore.getState().clear();
      useAuthStore.setState({
        state: 'booting',
        member: null,
        offline: false,
        endReason: null,
        upgradeLatest: null,
        email: null,
        pendingCode: null,
      });
      useBotsStore.setState({bots: []});
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
    const load = useBotsStore.getState().load;
    expect(typeof load).toBe('function');
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
      useBotsStore.setState({
        bots: [makeBot({id: 'bot1', selected: true})],
      });
    });
    act(() => {
      renderer.create(React.createElement(Harness));
    });
    act(() => {
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
    expect(useConversationsStore.getState().botId).toBe('bot1');
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

  it('workspace.changed relit les espaces et les bots', async () => {
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    await act(async () => {
      renderer.create(React.createElement(Harness));
    });
    await flush();
    mockListWorkspaces.mockClear();
    await act(async () => {
      subscribedHandler?.({
        type: 'workspace.changed',
        workspace_id: 'c_1',
        reason: 'member_joined',
      });
    });
    await flush();
    expect(mockListWorkspaces).toHaveBeenCalledTimes(1);
    expect(mockBotsLoad).toHaveBeenCalledWith(true);
  });

  it('transfert de propriété : le membre est relu (le type de compte change)', async () => {
    mockMe.mockResolvedValue({
      ok: true,
      status: 200,
      data: {member: {id: 'm1', account_type: 'invited'}},
      requestId: null,
      headers: new Headers(),
    });
    act(() => {
      useAuthStore.setState({state: 'signedIn'});
    });
    await act(async () => {
      renderer.create(React.createElement(Harness));
    });
    await act(async () => {
      subscribedHandler?.({
        type: 'workspace.changed',
        workspace_id: 'c_1',
        reason: 'ownership_transferred',
      });
    });
    await flush();
    expect(mockMe).toHaveBeenCalled();
    expect(
      (useAuthStore.getState().member as {account_type?: string} | null)
        ?.account_type,
    ).toBe('invited');
  });

  it('invité sans plus aucun espace (lu en ligne) : retour à la connexion', async () => {
    mockListWorkspaces.mockResolvedValue(workspacesOk([]));
    act(() => {
      useAuthStore.setState({
        state: 'signedIn',
        member: {id: 'm1', account_type: 'invited'} as never,
      });
    });
    await act(async () => {
      renderer.create(React.createElement(Harness));
    });
    await flush();
    expect(mockApplySignedOut).toHaveBeenCalledWith('access_removed');
  });

  it('particulier sans espace lu : jamais déconnecté', async () => {
    mockListWorkspaces.mockResolvedValue(workspacesOk([]));
    act(() => {
      useAuthStore.setState({
        state: 'signedIn',
        member: {id: 'm1', account_type: 'personal'} as never,
      });
    });
    await act(async () => {
      renderer.create(React.createElement(Harness));
    });
    await flush();
    expect(mockApplySignedOut).not.toHaveBeenCalled();
  });

  it('hors ligne : un invité n’est pas déconnecté', async () => {
    act(() => {
      useAuthStore.setState({
        state: 'signedIn',
        member: {id: 'm1', account_type: 'invited'} as never,
      });
    });
    await act(async () => {
      renderer.create(React.createElement(Harness));
    });
    await flush();
    expect(mockApplySignedOut).not.toHaveBeenCalled();
  });
});
