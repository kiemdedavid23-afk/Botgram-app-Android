/**
 * Tests store conversations L5b.
 */
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
} from '../src/features/conversations/store/conversationsStore';
import {stripPreview} from '../src/core/utils/stripPreview';
import type {ConversationSummary} from '../src/core/api/endpoints/conversations';

const mockList = jest.fn();
const mockGet = jest.fn();
const mockSearch = jest.fn();

jest.mock('../src/core/api/endpoints/conversations', () => ({
  listConversations: (...a: unknown[]) => mockList(...a),
  getConversation: (...a: unknown[]) => mockGet(...a),
  searchConversations: (...a: unknown[]) => mockSearch(...a),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() => Promise.resolve(undefined)),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDelete: jest.fn(() => Promise.resolve()),
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

  it('message.new avec conversation remplace et remonte', () => {
    useConversationsStore.setState({
      items: [
        conv({id: 'c1', last_message_at: 1, unread_count: 0}),
        conv({id: 'c2', last_message_at: 2, unread_count: 0}),
      ],
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
        last_message_at: 99,
        unread_count: 2,
        last_message_text: 'hi',
      }),
    });
    const items = useConversationsStore.getState().items;
    expect(items[0]!.id).toBe('c1');
    expect(useConversationsStore.getState().unreadTotal).toBe(2);
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

  it('conversation.changed removed retire la ligne', () => {
    useConversationsStore.setState({
      items: [conv({id: 'c1'}), conv({id: 'c2'})],
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

  it('recherche n’écrase pas un élément chargé', () => {
    useConversationsStore.setState({
      items: [
        conv({
          id: 'c1',
          title: 'Loaded',
          unread_count: 3,
          last_message_text: 'msg',
        }),
      ],
      searchQuery: 'x',
      searchItems: [
        conv({
          id: 'c1',
          title: 'Search',
          unread_count: 0,
          last_message_text: null,
        }),
      ],
    });
    // selectFilteredItems en mode recherche renvoie searchItems
    const filtered = selectFilteredItems(useConversationsStore.getState());
    expect(filtered[0]!.title).toBe('Search');
    // mais items chargés restent intacts
    expect(useConversationsStore.getState().items[0]!.unread_count).toBe(3);
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
