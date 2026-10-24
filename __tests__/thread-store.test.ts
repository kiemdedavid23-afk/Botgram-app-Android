/**
 * Tests store fil L5c.
 */
import {useThreadStore} from '../src/features/thread/store/threadStore';
import {mergeMessages, sortMessagesAsc} from '../src/features/thread/store/mergeMessages';
import type {Message} from '../src/core/realtime/events';
import type {HttpResult} from '../src/core/api/http';
import * as MessagesApi from '../src/core/api/endpoints/messages';

jest.mock('../src/core/api/endpoints/messages', () => ({
  listMessages: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() => Promise.resolve(undefined)),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDeleteByPrefix: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

import {
  cacheSetString,
  cacheDeleteByPrefix,
} from '../src/core/storage';

const mockList = MessagesApi.listMessages as jest.MockedFunction<
  typeof MessagesApi.listMessages
>;
const mockCacheSet = cacheSetString as jest.MockedFunction<typeof cacheSetString>;
const mockCacheDelPrefix = cacheDeleteByPrefix as jest.MockedFunction<
  typeof cacheDeleteByPrefix
>;

function okResult<T>(data: T): HttpResult<T> {
  return {
    ok: true,
    data,
    status: 200,
    requestId: null,
    headers: new Headers(),
  };
}

function msg(partial: Partial<Message> & {id: string}): Message {
  return {
    conversation_id: 'c1',
    direction: 'in',
    kind: 'text',
    text: partial.text ?? partial.id,
    created_at: partial.created_at ?? 1000,
    ...partial,
  };
}

describe('mergeMessages', () => {
  it('fusionne par id et trie croissant', () => {
    const a = msg({id: 'a', created_at: 2});
    const b = msg({id: 'b', created_at: 1});
    const merged = mergeMessages([a], [b, msg({id: 'a', text: 'upd', created_at: 2})]);
    expect(merged.map(m => m.id)).toEqual(['b', 'a']);
    expect(merged[1]!.text).toBe('upd');
  });
});

describe('threadStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThreadStore.getState().clear();
  });

  it('message.new insère ; autre conversation ignorée', () => {
    useThreadStore.setState({conversationId: 'c1', items: []});
    useThreadStore.getState().applyRealtimeEvent({
      type: 'message.new',
      id: 'e1',
      at: 1,
      bot_id: 'b',
      conversation_id: 'c1',
      message_id: 'm1',
      direction: 'in',
      kind: 'text',
      message: msg({id: 'm1', created_at: 5}),
    });
    expect(useThreadStore.getState().items.map(m => m.id)).toEqual(['m1']);
    useThreadStore.getState().applyRealtimeEvent({
      type: 'message.new',
      id: 'e2',
      at: 2,
      bot_id: 'b',
      conversation_id: 'other',
      message_id: 'm2',
      direction: 'in',
      kind: 'text',
      message: msg({id: 'm2', conversation_id: 'other'}),
    });
    expect(useThreadStore.getState().items.map(m => m.id)).toEqual(['m1']);
  });

  it('message.updated deleted retire le message', () => {
    useThreadStore.setState({
      conversationId: 'c1',
      items: [msg({id: 'm1'}), msg({id: 'm2'})],
    });
    useThreadStore.getState().applyRealtimeEvent({
      type: 'message.updated',
      id: 'e',
      at: 1,
      reason: 'deleted',
      message_id: 'm1',
      conversation_id: 'c1',
      bot_id: 'b',
    });
    expect(useThreadStore.getState().items.map(m => m.id)).toEqual(['m2']);
  });

  it('repli REST si message absent', async () => {
    mockList.mockResolvedValue(
      okResult({items: [msg({id: 'm9'})], next_cursor: null}),
    );
    useThreadStore.setState({conversationId: 'c1', items: []});
    useThreadStore.getState().applyRealtimeEvent({
      type: 'message.new',
      id: 'e',
      at: 1,
      bot_id: 'b',
      conversation_id: 'c1',
      message_id: 'm9',
      direction: 'in',
      kind: 'text',
    });
    await Promise.resolve();
    await Promise.resolve();
    expect(mockList).toHaveBeenCalled();
  });

  it('course : changement de conversation ignore le résultat', async () => {
    let resolve!: (v: HttpResult<{items: Message[]; next_cursor: null}>) => void;
    const deferred = new Promise<
      HttpResult<{items: Message[]; next_cursor: null}>
    >(r => {
      resolve = r;
    });
    mockList.mockReturnValueOnce(deferred);
    useThreadStore.setState({conversationId: 'c1', items: []});
    const p = useThreadStore.getState().load(true);
    useThreadStore.setState({conversationId: 'c2', items: []});
    resolve(okResult({items: [msg({id: 'pollute', conversation_id: 'c1'})], next_cursor: null}));
    await p;
    expect(
      useThreadStore.getState().items.every(m => m.id !== 'pollute'),
    ).toBe(true);
  });

  it('clear supprime le cache par préfixe', () => {
    useThreadStore.getState().clear();
    expect(mockCacheDelPrefix).toHaveBeenCalledWith('thread.messages.');
  });

  it('album = une entrée (id unique)', () => {
    const album = msg({id: 'alb1', kind: 'album', text: 'cap'});
    const sorted = sortMessagesAsc([album]);
    expect(sorted).toHaveLength(1);
    expect(sorted[0]!.kind).toBe('album');
  });

  it('load écrit le cache (≤ 50)', async () => {
    mockList.mockResolvedValue(
      okResult({items: [msg({id: 'm1'})], next_cursor: null}),
    );
    useThreadStore.setState({conversationId: 'c1'});
    await useThreadStore.getState().load(true);
    expect(mockCacheSet).toHaveBeenCalled();
    const key = mockCacheSet.mock.calls[0]?.[0];
    expect(key).toContain('thread.messages.c1');
  });
});
