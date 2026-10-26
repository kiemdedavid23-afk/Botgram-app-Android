import {
  doDeleteOutgoing,
  removeMessageLocally,
} from '../src/features/thread/store/messageActions';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import type {Message} from '../src/core/realtime/events';
import type {ThreadSlice} from '../src/features/thread/store/sendActions';

jest.mock('../src/core/api/endpoints/messages', () => ({
  deleteMessage: jest.fn(),
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  retryMessage: jest.fn(),
  markConversationRead: jest.fn(),
  sendMedia: jest.fn(),
  sendAlbum: jest.fn(),
  fetchAttachment: jest.fn(),
}));

const mockDelete = MessagesApi.deleteMessage as jest.MockedFunction<
  typeof MessagesApi.deleteMessage
>;

function msg(partial: Partial<Message>): Message {
  return {
    id: 'm1',
    conversation_id: 'c1',
    direction: 'out',
    kind: 'text',
    status: 'sent',
    text: 'hi',
    ...partial,
  };
}

describe('doDeleteOutgoing', () => {
  let state: ThreadSlice;

  const ctx = {
    get: (): ThreadSlice => state,
    set: (
      p:
        | Partial<ThreadSlice>
        | ((s: ThreadSlice) => Partial<ThreadSlice>),
    ) => {
      const next = typeof p === 'function' ? p(state) : p;
      state = {...state, ...next};
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    state = {
      conversationId: 'c1',
      items: [msg({})],
      offline: false,
      sending: false,
      sendError: null,
      lastReadMarked: false,
    };
  });

  it('local: retire sans réseau', async () => {
    state = {
      ...state,
      items: [msg({id: 'local:abc', status: 'failed'})],
    };
    await doDeleteOutgoing(state.items[0]!, ctx);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(state.items).toHaveLength(0);
  });

  it('sent supprimé côté serveur', async () => {
    mockDelete.mockResolvedValue({
      ok: true,
      data: {deleted: true, telegram: true},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await doDeleteOutgoing(state.items[0]!, ctx);
    expect(mockDelete).toHaveBeenCalledWith('m1');
    expect(state.items).toHaveLength(0);
  });

  it('MESSAGE_TOO_OLD laisse le message', async () => {
    mockDelete.mockResolvedValue({
      ok: false,
      error: {code: 'MESSAGE_TOO_OLD', message: 'old'},
      status: 409,
      requestId: null,
      headers: new Headers(),
    });
    await doDeleteOutgoing(state.items[0]!, ctx);
    expect(state.items).toHaveLength(1);
    expect(state.sendError).toBeTruthy();
  });

  it('MESSAGE_NOT_DELETABLE', async () => {
    mockDelete.mockResolvedValue({
      ok: false,
      error: {code: 'MESSAGE_NOT_DELETABLE', message: 'x'},
      status: 409,
      requestId: null,
      headers: new Headers(),
    });
    await doDeleteOutgoing(msg({status: 'unknown'}), ctx);
    expect(state.items).toHaveLength(1);
  });

  it('entrant non supprimé', async () => {
    await doDeleteOutgoing(msg({direction: 'in'}), ctx);
    expect(mockDelete).not.toHaveBeenCalled();
  });

  it('removeMessageLocally filtre par id', () => {
    const list = [msg({id: 'a'}), msg({id: 'b'})];
    expect(removeMessageLocally(list, 'a').map(m => m.id)).toEqual(['b']);
  });
});