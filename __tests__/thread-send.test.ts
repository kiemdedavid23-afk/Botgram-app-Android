/**
 * L5d — envoi, retry, marquer lu, courses.
 */
import {useThreadStore} from '../src/features/thread/store/threadStore';
import {upsertOutgoing} from '../src/features/thread/store/sendActions';
import type {Message} from '../src/core/realtime/events';
import type {HttpResult} from '../src/core/api/http';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import {threadMetrics as tm} from '../src/shared/theme/threadMetrics';

jest.mock('../src/core/api/endpoints/messages', () => ({
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  retryMessage: jest.fn(),
  markConversationRead: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() => Promise.resolve(undefined)),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDeleteByPrefix: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

jest.mock('../src/core/utils/uuid', () => ({
  uuidV4: () => 'fixed-uuid-0000-0000-0000-000000000001',
}));

jest.mock('../src/features/conversations/store/conversationsStore', () => ({
  useConversationsStore: {
    getState: () => ({
      applyRealtimeEvent: jest.fn(),
    }),
  },
}));

const mockSend = MessagesApi.sendMessage as jest.MockedFunction<
  typeof MessagesApi.sendMessage
>;
const mockRetry = MessagesApi.retryMessage as jest.MockedFunction<
  typeof MessagesApi.retryMessage
>;
const mockRead = MessagesApi.markConversationRead as jest.MockedFunction<
  typeof MessagesApi.markConversationRead
>;

function okResult<T>(data: T, status = 200): HttpResult<T> {
  return {
    ok: true,
    data,
    status,
    requestId: null,
    headers: new Headers(),
  };
}

function failResult(status: number, code: string): HttpResult<never> {
  return {
    ok: false,
    error: {code, message: code},
    status,
    requestId: null,
    headers: new Headers(),
  };
}

function msg(partial: Partial<Message> & {id: string}): Message {
  return {
    conversation_id: 'c1',
    direction: 'out',
    kind: 'text',
    text: 'hi',
    created_at: 1000,
    ...partial,
  };
}

describe('upsertOutgoing', () => {
  it('remplace l’optimiste par le message serveur (même client_message_id)', () => {
    const local = msg({
      id: 'local:u1',
      client_message_id: 'u1',
      status: 'sending',
    });
    const server = msg({
      id: 'srv1',
      client_message_id: 'u1',
      status: 'sent',
    });
    const merged = upsertOutgoing([local], server);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.id).toBe('srv1');
    expect(merged[0]!.status).toBe('sent');
  });
});

describe('threadStore send / retry / read', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThreadStore.getState().clear();
    useThreadStore.setState({
      conversationId: 'c1',
      offline: false,
      items: [],
      lastReadMarked: false,
    });
  });

  it('envoi nominal 201', async () => {
    mockSend.mockResolvedValue(
      okResult(
        {
          message: msg({
            id: 'm1',
            status: 'sent',
            client_message_id: 'fixed-uuid-0000-0000-0000-000000000001',
          }),
        },
        201,
      ),
    );
    await useThreadStore.getState().send('bonjour');
    expect(mockSend).toHaveBeenCalledWith('c1', {
      text: 'bonjour',
      client_message_id: 'fixed-uuid-0000-0000-0000-000000000001',
    });
    const items = useThreadStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0]!.status).toBe('sent');
    expect(items[0]!.id).toBe('m1');
  });

  it('rejeu 200 même client_message_id sans doublon', async () => {
    mockSend.mockResolvedValue(
      okResult({
        message: msg({
          id: 'm1',
          status: 'sent',
          client_message_id: 'cid-1',
        }),
      }),
    );
    useThreadStore.setState({
      items: [
        msg({
          id: 'local:cid-1',
          client_message_id: 'cid-1',
          status: 'failed',
          error_code: 'local_network',
          text: 'x',
        }),
      ],
    });
    await useThreadStore.getState().resendSameId(
      useThreadStore.getState().items[0]!,
    );
    expect(useThreadStore.getState().items).toHaveLength(1);
  });

  it('201 avec status failed affiché', async () => {
    mockSend.mockResolvedValue(
      okResult(
        {
          message: msg({
            id: 'm1',
            status: 'failed',
            error_code: 'blocked',
            client_message_id: 'fixed-uuid-0000-0000-0000-000000000001',
          }),
        },
        201,
      ),
    );
    await useThreadStore.getState().send('x');
    expect(useThreadStore.getState().items[0]!.status).toBe('failed');
  });

  it('texte vide / espaces seuls n’envoie pas', async () => {
    await useThreadStore.getState().send('   ');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('texte > 4096 n’envoie pas', async () => {
    await useThreadStore.getState().send('a'.repeat(tm.maxMessageLength + 1));
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('hors ligne : pas d’envoi', async () => {
    useThreadStore.setState({offline: true});
    await useThreadStore.getState().send('hello');
    expect(mockSend).not.toHaveBeenCalled();
  });

  it('erreur réseau → failed local + même uuid au renvoi', async () => {
    mockSend.mockResolvedValueOnce(failResult(0, 'NETWORK'));
    await useThreadStore.getState().send('net');
    const failed = useThreadStore.getState().items[0]!;
    expect(failed.status).toBe('failed');
    expect(failed.error_code).toBe('local_network');
    mockSend.mockResolvedValueOnce(
      okResult({
        message: msg({
          id: 'm9',
          status: 'sent',
          client_message_id: failed.client_message_id!,
        }),
      }),
    );
    await useThreadStore.getState().resendSameId(failed);
    expect(mockSend.mock.calls[1]![1].client_message_id).toBe(
      failed.client_message_id,
    );
  });

  it('retry seulement si retryable', async () => {
    useThreadStore.setState({
      items: [msg({id: 'm1', retryable: false, status: 'failed'})],
    });
    await useThreadStore.getState().retry('m1');
    expect(mockRetry).not.toHaveBeenCalled();
  });

  it('retryable true appelle POST retry', async () => {
    useThreadStore.setState({
      items: [
        msg({
          id: 'm1',
          retryable: true,
          status: 'queued',
          retry_at: Date.now() - 1000,
        }),
      ],
    });
    mockRetry.mockResolvedValue(
      okResult({
        message: msg({id: 'm1', status: 'sent', retryable: false}),
        retried: true,
      }),
    );
    await useThreadStore.getState().retry('m1');
    expect(mockRetry).toHaveBeenCalledWith('m1');
    expect(useThreadStore.getState().items[0]!.status).toBe('sent');
  });

  it('markRead appelé une fois', async () => {
    mockRead.mockResolvedValue(okResult({unread_count: 0}));
    await useThreadStore.getState().markRead();
    await useThreadStore.getState().markRead();
    expect(mockRead).toHaveBeenCalledTimes(1);
  });

  it('markRead hors ligne : aucun appel', async () => {
    useThreadStore.setState({offline: true});
    await useThreadStore.getState().markRead();
    expect(mockRead).not.toHaveBeenCalled();
  });

  it('course : changement de conversation ignore la réponse d’envoi', async () => {
    let resolve!: (v: HttpResult<{message: Message}>) => void;
    const deferred = new Promise<HttpResult<{message: Message}>>(r => {
      resolve = r;
    });
    mockSend.mockReturnValueOnce(deferred);
    const p = useThreadStore.getState().send('race');
    useThreadStore.setState({conversationId: 'c2', items: []});
    resolve(
      okResult({
        message: msg({
          id: 'pollute',
          conversation_id: 'c1',
          status: 'sent',
          client_message_id: 'fixed-uuid-0000-0000-0000-000000000001',
        }),
      }),
    );
    await p;
    expect(
      useThreadStore.getState().items.every(m => m.id !== 'pollute'),
    ).toBe(true);
  });
});
