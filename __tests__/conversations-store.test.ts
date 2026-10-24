/**
 * Tests store conversations L5b (+ réserves audit).
 */
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
} from '../src/features/conversations/store/conversationsStore';
import {stripPreview} from '../src/core/utils/stripPreview';
import type {ConversationSummary} from '../src/core/api/endpoints/conversations';

const mockList = jest.fn(
  (_botId: string, _opts?: {limit?: number; cursor?: string | null}) =>
    Promise.resolve({
      ok: false as const,
      error: {code: 'MOCK', message: 'unmocked'},
      status: 0,
      requestId: null,
      headers: new Headers(),
    }),
);
const mockGet = jest.fn((_id: string) =>
  Promise.resolve({
    ok: false as const,
    error: {code: 'MOCK', message: 'unmocked'},
    status: 0,
    requestId: null,
    headers: new Headers(),
  }),
);
const mockSearch = jest.fn((_botId: string, _q: string, _limit?: number) =>
  Promise.resolve({
    ok: false as const,
    error: {code: 'MOCK', message: 'unmocked'},
    status: 0,
    requestId: null,
    headers: new Headers(),
  }),
);
const mockCacheDelete = jest.fn((_key: string) => Promise.resolve());
const mockCacheSet = jest.fn((_key: string, _value: string) =>
  Promise.resolve(),
);
const mockCacheGet = jest.fn(
  (_key: string): Promise<string | undefined> => Promise.resolve(undefined),
);

jest.mock('../src/core/api/endpoints/conversations', () => ({
  listConversations: (
    botId: string,
    opts?: {limit?: number; cursor?: string | null},
  ) => mockList(botId, opts),
  getConversation: (id: string) => mockGet(id),
  searchConversations: (botId: string, q: string, limit?: number) =>
    mockSearch(botId, q, limit),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: (key: string) => mockCacheGet(key),
  cacheSetString: (key: string, value: string) => mockCacheSet(key, value),
  cacheDelete: (key: string) => mockCacheDelete(key),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

function conv(
  partial: Partial<ConversationSummary> & {id: string},
): ConversationSummary {
  return {
    bot_id: 'bot1',
    chat_type: 'private',
    title: partial.title ?? partial.id,
    unread_count: 0,
    last_message_at: 1000,
    ...partial,
  };
}

describe('stripPreview', () => {
  it('retire les balises HTML et Markdown', () => {
    expect(stripPreview('<b>Hello</b> *world*')).toBe('Hello world');
    expect(stripPreview('[lien](http://x)')).toBe('lien');
  });
});

describe('conversationsStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useConversationsStore.getState().clear();
    useConversationsStore.setState({botId: 'bot1'});
  });

  it('fusionne par id sans doublon', () => {
    const a = conv({id: 'c1', title: 'A', last_message_at: 1});
    const b = conv({id: 'c1', title: 'B', last_message_at: 2});
    useConversationsStore.setState({items: [a]});
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'updates',
      conversations: [b],
      unread: {bot1: 0},
      has_more: false,
    });
    const items = useConversationsStore.getState().items;
    expect(items.length).toBe(1);
    expect(items[0]!.title).toBe('B');
  });

  it('épinglées restent en tête', () => {
    useConversationsStore.setState({
      items: [
        conv({id: 'c1', pinned: false, last_message_at: 200}),
        conv({id: 'c2', pinned: true, last_message_at: 100}),
      ],
    });
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'updates',
      conversations: [
        conv({id: 'c3', pinned: false, last_message_at: 300, title: 'New'}),
      ],
      unread: {},
      has_more: false,
    });
    const ids = useConversationsStore.getState().items.map(i => i.id);
    expect(ids[0]).toBe('c2');
  });

  it('message.new hors écran incrémente unreadTotal', () => {
    useConversationsStore.setState({
      botId: 'bot1',
      items: [conv({id: 'c1', unread_count: 0})],
      unreadTotal: 0,
    });
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'message.new',
      id: 'e1',
      at: 1,
      bot_id: 'bot1',
      conversation_id: 'c1',
      message_id: 'm1',
      direction: 'in',
      kind: 'text',
      conversation: conv({
        id: 'c1',
        unread_count: 3,
        last_message_at: 99,
      }),
    });
    expect(useConversationsStore.getState().unreadTotal).toBe(3);
  });

  it('message.new sans conversation déclenche GET (repli REST)', async () => {
    mockGet.mockResolvedValue({
      ok: true,
      data: {
        conversation: conv({id: 'c9', last_message_at: 50, title: 'Rest'}),
      },
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    useConversationsStore.setState({items: [], botId: 'bot1'});
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'message.new',
      id: 'e2',
      at: 1,
      bot_id: 'bot1',
      conversation_id: 'c9',
      message_id: 'm2',
      direction: 'in',
      kind: 'text',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockGet).toHaveBeenCalledWith('c9');
  });

  it('conversation.read remet unread à 0', () => {
    useConversationsStore.setState({
      items: [conv({id: 'c1', unread_count: 5})],
      unreadTotal: 5,
    });
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'conversation.read',
      id: 'r1',
      at: 1,
      conversation_id: 'c1',
    });
    expect(useConversationsStore.getState().items[0]!.unread_count).toBe(0);
    expect(useConversationsStore.getState().unreadTotal).toBe(0);
  });

  it('conversation.changed removed décompte unreadTotal', () => {
    useConversationsStore.setState({
      items: [conv({id: 'c1', unread_count: 4}), conv({id: 'c2'})],
      unreadTotal: 4,
    });
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'conversation.changed',
      id: 'x',
      at: 1,
      conversation_id: 'c1',
      reason: 'removed',
    });
    expect(useConversationsStore.getState().items.map(i => i.id)).toEqual([
      'c2',
    ]);
    expect(useConversationsStore.getState().unreadTotal).toBe(0);
  });

  it('resync conversations recharge', async () => {
    mockList.mockResolvedValue({
      ok: true,
      data: {items: [conv({id: 'c1'})], next_cursor: null},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    useConversationsStore.setState({botId: 'bot1', items: []});
    useConversationsStore.getState().applyRealtimeEvent({
      type: 'resync',
      scopes: ['conversations'],
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockList).toHaveBeenCalled();
  });

  it('changement de bot pendant load ignore le résultat', async () => {
    let resolveList: (v: unknown) => void = () => undefined;
    mockList.mockImplementation(
      () =>
        new Promise(r => {
          resolveList = r;
        }),
    );
    useConversationsStore.setState({botId: 'bot1', items: []});
    const p = useConversationsStore.getState().load(true);
    useConversationsStore.setState({botId: 'bot2', items: []});
    resolveList({
      ok: true,
      data: {
        items: [conv({id: 'c1', bot_id: 'bot1'})],
        next_cursor: null,
      },
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await p;
    expect(useConversationsStore.getState().botId).toBe('bot2');
    expect(
      useConversationsStore.getState().items.every(i => i.bot_id !== 'bot1'),
    ).toBe(true);
  });

  it('recherche ancienne n’écrase pas une plus récente', async () => {
    let resolveFirst: (v: unknown) => void = () => undefined;
    mockSearch.mockImplementationOnce(
      () =>
        new Promise(r => {
          resolveFirst = r;
        }),
    );
    useConversationsStore.setState({botId: 'bot1', searchQuery: 'ab'});
    const p1 = useConversationsStore.getState().search('ab');
    useConversationsStore.setState({searchQuery: 'xyz'});
    mockSearch.mockResolvedValueOnce({
      ok: true,
      data: {
        items: [conv({id: 'c-new', title: 'New'})],
        next_cursor: null,
      },
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await useConversationsStore.getState().search('xyz');
    resolveFirst({
      ok: true,
      data: {
        items: [conv({id: 'c-old', title: 'Old'})],
        next_cursor: null,
      },
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await p1;
    const titles = useConversationsStore
      .getState()
      .searchItems.map(i => i.title);
    expect(titles).not.toContain('Old');
  });

  it('clear supprime toutes les clés cache conversations', async () => {
    mockList.mockResolvedValue({
      ok: true,
      data: {items: [conv({id: 'c1'})], next_cursor: null},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    useConversationsStore.setState({botId: 'botA'});
    await useConversationsStore.getState().load(true);
    useConversationsStore.setState({botId: 'botB'});
    await useConversationsStore.getState().load(true);
    useConversationsStore.getState().clear();
    await Promise.resolve();
    expect(mockCacheDelete).toHaveBeenCalled();
    const keys = mockCacheDelete.mock.calls.map(c => c[0]);
    expect(keys.some(k => k.includes('botA'))).toBe(true);
    expect(keys.some(k => k.includes('botB'))).toBe(true);
  });

  it('erreur HTTP non réseau avec cache : pas offline', async () => {
    mockCacheGet.mockResolvedValueOnce(
      JSON.stringify([conv({id: 'c1', title: 'Cached'})]),
    );
    mockList.mockResolvedValueOnce({
      ok: false,
      error: {code: 'SERVER', message: 'err'},
      status: 500,
      requestId: null,
      headers: new Headers(),
    });
    useConversationsStore.setState({botId: 'bot1', items: []});
    await useConversationsStore.getState().load(true);
    expect(useConversationsStore.getState().offline).toBe(false);
    expect(useConversationsStore.getState().items[0]?.title).toBe('Cached');
  });

  it('filtres onglets locaux', () => {
    useConversationsStore.setState({
      items: [
        conv({id: 'p', chat_type: 'private', unread_count: 1}),
        conv({id: 'g', chat_type: 'group', unread_count: 0}),
        conv({id: 'c', chat_type: 'channel', unread_count: 2}),
      ],
      folder: 'work',
      searchQuery: '',
    });
    const filtered = selectFilteredItems(useConversationsStore.getState());
    expect(filtered.map(i => i.id).sort()).toEqual(['c', 'g']);
    const counts = folderCounts(useConversationsStore.getState().items);
    expect(counts.unread).toBe(2);
    expect(counts.personal).toBe(1);
  });

  it('clear vide le store (déconnexion)', () => {
    useConversationsStore.setState({
      botId: 'bot1',
      items: [conv({id: 'c1'})],
      unreadTotal: 2,
    });
    useConversationsStore.getState().clear();
    expect(useConversationsStore.getState().items).toEqual([]);
    expect(useConversationsStore.getState().botId).toBeNull();
    expect(useConversationsStore.getState().unreadTotal).toBe(0);
  });
});
