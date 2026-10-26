import {doDeleteOutgoing, removeMessageLocally} from '../src/features/thread/store/messageActions';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import type {Message} from '../src/core/realtime/events';

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
  let items: Message[];
  let sendError: string | null;
  const ctx = {
    get: () => ({
      conversationId: 'c1',
      items,
      offline: false,
      sending: false,
      sendError,
      lastReadMarked: false,
    }),
    set: (
      p:
        | Partial<{items: Message[]; sendError: string | null}>
        | ((s: {items: Message[]; sendError: string | null}) => Partial<{
            items: Message[];
            sendError: string | null;
          }>),
    ) => {
      const next = typeof p === 'function' ? p({items, sendError}) : p;
      if (next.items) items = next.items;
      if (next.sendError !== undefined) sendError = next.sendError;
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    items = [msg({})];
    sendError = null;
  });

  it('local: retire sans réseau', async () => {
    items = [msg({id: 'local:abc', status: 'failed'})];
    await doDeleteOutgoing(items[0]!, ctx);
    expect(mockDelete).not.toHaveBeenCalled();
    expect(items).toHaveLength(0);
  });

  it('sent supprimé côté serveur', async () => {
    mockDelete.mockResolvedValue({
      ok: true,
      data: {deleted: true, telegram: true},
      status: 200,
      requestId: null,
      headers: new Headers(),
    });
    await doDeleteOutgoing(items[0]!, ctx);
    expect(mockDelete).toHaveBeenCalledWith('m1');
    expect(items).toHaveLength(0);
  });

  it('MESSAGE_TOO_OLD laisse le message', async () => {
    mockDelete.mockResolvedValue({
      ok: false,
      error: {code: 'MESSAGE_TOO_OLD', message: 'old'},
      status: 409,
      requestId: null,
      headers: new Headers(),
    });
    await doDeleteOutgoing(items[0]!, ctx);
    expect(items).toHaveLength(1);
    expect(sendError).toBeTruthy();
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
    expect(items).toHaveLength(1);
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
