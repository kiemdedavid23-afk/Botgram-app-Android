import {
  doPinConversation,
  doDeleteConversation,
  removeConversationLocally,
  sortConversations,
} from '../src/features/conversations/store/conversationActions';
import * as Api from '../src/core/api/endpoints/conversations';
import type {ConversationSummary} from '../src/core/realtime/events';

jest.mock('../src/core/api/endpoints/conversations', () => ({
  pinConversation: jest.fn(),
  deleteConversation: jest.fn(),
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  searchConversations: jest.fn(),
}));

const mockPin = Api.pinConversation as jest.MockedFunction<typeof Api.pinConversation>;
const mockDel = Api.deleteConversation as jest.MockedFunction<typeof Api.deleteConversation>;

function conv(partial: Partial<ConversationSummary>): ConversationSummary {
  return {
    id: 'c1',
    bot_id: 'b1',
    pinned: false,
    last_message_at: 1000,
    ...partial,
  };
}

describe('conversation actions', () => {
  let items: ConversationSummary[];
  let error: string | null;
  const ctx = {
    get: () => ({items, error}),
    set: (
      p:
        | Partial<{items: ConversationSummary[]; error: string | null}>
        | ((s: {items: ConversationSummary[]; error: string | null}) => Partial<{
            items: ConversationSummary[];
            error: string | null;
          }>),
    ) => {
      const next = typeof p === 'function' ? p({items, error}) : p;
      if (next.items) items = next.items;
      if (next.error !== undefined) error = next.error;
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    items = [conv({id: 'c1', pinned: false}), conv({id: 'c2', pinned: true, last_message_at: 500})];
    error = null;
  });

  it('épingler met à jour et trie', async () => {
    mockPin.mockResolvedValue({
      ok: true,
      data: {conversation: conv({id: 'c1', pinned: true, last_message_at: 1000})},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await doPinConversation('c1', true, ctx);
    expect(items[0]!.id).toBe('c1');
    expect(items[0]!.pinned).toBe(true);
  });

  it('supprimer retire de la liste', async () => {
    mockDel.mockResolvedValue({
      ok: true,
      data: {deleted: true},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    const ok = await doDeleteConversation('c1', ctx);
    expect(ok).toBe(true);
    expect(items.map(c => c.id)).toEqual(['c2']);
  });

  it('removeConversationLocally', () => {
    expect(removeConversationLocally(items, 'c1').map(c => c.id)).toEqual(['c2']);
  });

  it('sortConversations épinglées d\'abord', () => {
    const sorted = sortConversations([
      conv({id: 'a', pinned: false, last_message_at: 2000}),
      conv({id: 'b', pinned: true, last_message_at: 100}),
    ]);
    expect(sorted[0]!.id).toBe('b');
  });
});
