/**
 * Tests store conversations L5b (+ réserves audit).
 */
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
} from '../src/features/conversations/store/conversationsStore';
import {stripPreview} from '../src/core/utils/stripPreview';
import type {HttpResult} from '../src/core/api/http';
import type {
  ConversationSummary,
  ConversationsPage,
} from '../src/core/api/endpoints/conversations';
import * as ConversationsApi from '../src/core/api/endpoints/conversations';
import * as CacheApi from '../src/core/storage';

jest.mock('../src/core/api/endpoints/conversations', () => ({
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  searchConversations: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() =>
    Promise.resolve(undefined as string | undefined),
  ),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDelete: jest.fn(() => Promise.resolve()),
  cacheDeleteByPrefix: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

const mockList = ConversationsApi.listConversations as jest.MockedFunction<
  typeof ConversationsApi.listConversations
>;
const mockGet = ConversationsApi.getConversation as jest.MockedFunction<
  typeof ConversationsApi.getConversation
>;
const mockSearch = ConversationsApi.searchConversations as jest.MockedFunction<
  typeof ConversationsApi.searchConversations
>;
const mockCacheGet = CacheApi.cacheGetString as jest.MockedFunction<
  typeof CacheApi.cacheGetString
>;
const mockCacheSet = CacheApi.cacheSetString as jest.MockedFunction<
  typeof CacheApi.cacheSetString
>;
const mockCacheDelete = CacheApi.cacheDelete as jest.MockedFunction<
  typeof CacheApi.cacheDelete
>;
const mockCacheDeleteByPrefix =
  CacheApi.cacheDeleteByPrefix as jest.MockedFunction<
    typeof CacheApi.cacheDeleteByPrefix
  >;

type SearchPage = {items: ConversationSummary[]; next_cursor: null};

function okResult<T>(data: T): HttpResult<T> {
  return {
    ok: true,
    data,
    status: 200,
    requestId: null,
    headers: new Headers(),
  };
}

function failResult<T>(status = 0): HttpResult<T> {
  return {
    ok: false,
    error: {code: 'x', message: 'x'},
    status,
    requestId: null,
    headers: new Headers(),
  };
}

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
    mockGet.mockResolvedValue(
      okResult({
        conversation: conv({id: 'c9', last_message_at: 50, title: 'Rest'}),
      }),
    );
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
    mockList.mockResolvedValue(
      okResult<ConversationsPage>({
        items: [conv({id: 'c1'})],
        next_cursor: null,
      }),
    );
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
    let resolveList!: (v: HttpResult<ConversationsPage>) => void;
    const deferred = new Promise<HttpResult<ConversationsPage>>(r => {
      resolveList = r;
    });
    mockList.mockReturnValueOnce(deferred);
    useConversationsStore.setState({botId: 'bot1', items: []});
    const p = useConversationsStore.getState().load(true);
    useConversationsStore.setState({botId: 'bot2', items: []});
    resolveList(
      okResult<ConversationsPage>({
        items: [conv({id: 'c1', bot_id: 'bot1'})],
        next_cursor: null,
      }),
    );
    await p;
    expect(useConversationsStore.getState().botId).toBe('bot2');
    expect(
      useConversationsStore.getState().items.every(i => i.bot_id !== 'bot1'),
    ).toBe(true);
  });

  it('recherche ancienne n’écrase pas une plus récente', async () => {
    let resolveFirst!: (v: HttpResult<SearchPage>) => void;
    const deferred = new Promise<HttpResult<SearchPage>>(r => {
      resolveFirst = r;
    });
    mockSearch.mockReturnValueOnce(deferred);
    useConversationsStore.setState({botId: 'bot1', searchQuery: 'ab'});
    const p1 = useConversationsStore.getState().search('ab');
    useConversationsStore.setState({searchQuery: 'xyz'});
    mockSearch.mockResolvedValueOnce(
      okResult<SearchPage>({
        items: [conv({id: 'c-new', title: 'New'})],
        next_cursor: null,
      }),
    );
    await useConversationsStore.getState().search('xyz');
    resolveFirst(
      okResult<SearchPage>({
        items: [conv({id: 'c-old', title: 'Old'})],
        next_cursor: null,
      }),
    );
    await p1;
    const titles = useConversationsStore
      .getState()
      .searchItems.map(i => i.title);
    expect(titles).not.toContain('Old');
  });

  it('clear appelle cacheDeleteByPrefix(conversations.page1.)', async () => {
    mockList.mockResolvedValue(
      okResult<ConversationsPage>({
        items: [conv({id: 'c1'})],
        next_cursor: null,
      }),
    );
    useConversationsStore.setState({botId: 'botA'});
    await useConversationsStore.getState().load(true);
    expect(mockCacheSet).toHaveBeenCalled();
    useConversationsStore.getState().clear();
    await Promise.resolve();
    expect(mockCacheDeleteByPrefix).toHaveBeenCalledWith('conversations.page1.');
  });

  it('loadMore : changement de bot ignore le résultat', async () => {
    let resolveMore!: (v: HttpResult<ConversationsPage>) => void;
    const deferred = new Promise<HttpResult<ConversationsPage>>(r => {
      resolveMore = r;
    });
    useConversationsStore.setState({
      botId: 'bot1',
      items: [conv({id: 'old'})],
      nextCursor: 'cur',
    });
    mockList.mockReturnValueOnce(deferred);
    const p = useConversationsStore.getState().loadMore();
    useConversationsStore.setState({botId: 'bot2', items: []});
    resolveMore(
      okResult<ConversationsPage>({
        items: [conv({id: 'pollute', bot_id: 'bot1'})],
        next_cursor: null,
      }),
    );
    await p;
    expect(useConversationsStore.getState().botId).toBe('bot2');
    expect(
      useConversationsStore.getState().items.every(i => i.id !== 'pollute'),
    ).toBe(true);
  });

  it('search : changement de bot remet searching à false', async () => {
    let resolveSearch!: (v: HttpResult<SearchPage>) => void;
    const deferred = new Promise<HttpResult<SearchPage>>(r => {
      resolveSearch = r;
    });
    mockSearch.mockReturnValueOnce(deferred);
    useConversationsStore.setState({
      botId: 'bot1',
      searchQuery: 'ab',
      searching: false,
    });
    const p = useConversationsStore.getState().search('ab');
    useConversationsStore.setState({botId: 'bot2'});
    resolveSearch(
      okResult<SearchPage>({
        items: [conv({id: 'x', title: 'X'})],
        next_cursor: null,
      }),
    );
    await p;
    expect(useConversationsStore.getState().searching).toBe(false);
    expect(useConversationsStore.getState().searchItems).toEqual([]);
  });

  it('erreur HTTP non réseau avec cache : pas offline', async () => {
    mockCacheGet.mockResolvedValueOnce(
      JSON.stringify([conv({id: 'c1', title: 'Cached'})]),
    );
    mockList.mockResolvedValueOnce(failResult<ConversationsPage>(500));
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
