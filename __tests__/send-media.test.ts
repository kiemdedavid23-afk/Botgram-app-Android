import {kindFromMime} from '../src/features/thread/mediaLimits';
import {validateMediaSend as validate} from '../src/features/thread/store/sendMediaActions';
import {useThreadStore} from '../src/features/thread/store/threadStore';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import type {HttpResult} from '../src/core/api/http';
import type {Message} from '../src/core/realtime/events';

// re-export check - validateMediaSend from actions
jest.mock('../src/core/api/endpoints/messages', () => ({
  listMessages: jest.fn(),
  sendMessage: jest.fn(),
  retryMessage: jest.fn(),
  markConversationRead: jest.fn(),
  sendMedia: jest.fn(),
  sendAlbum: jest.fn(),
  fetchAttachment: jest.fn(),
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
  uuidV4: () => 'media-uuid-0001',
}));

jest.mock('../src/features/conversations/store/conversationsStore', () => ({
  useConversationsStore: {
    getState: () => ({items: [], applyRealtimeEvent: jest.fn()}),
  },
}));

const mockSendMedia = MessagesApi.sendMedia as jest.MockedFunction<
  typeof MessagesApi.sendMedia
>;
const mockSendAlbum = MessagesApi.sendAlbum as jest.MockedFunction<
  typeof MessagesApi.sendAlbum
>;

function okMsg(partial: Partial<Message>): HttpResult<{message: Message}> {
  return {
    ok: true,
    data: {
      message: {
        id: 'srv',
        conversation_id: 'c1',
        direction: 'out',
        kind: 'photo',
        status: 'sent',
        ...partial,
      },
    },
    status: 201,
    requestId: null,
    headers: new Headers(),
  };
}

function fail(code: string, status: number): HttpResult<never> {
  return {
    ok: false,
    error: {code, message: code},
    status,
    requestId: null,
    headers: new Headers(),
  };
}

const file = (
  size: number,
  mime = 'image/jpeg',
  name = 'a.jpg',
): import('../src/features/thread/store/sendMediaActions').PickedFile => ({
  uri: 'file:///tmp/a',
  name,
  mime,
  size,
});

describe('validateMediaSend', () => {
  it('refuse fichier > 10 Mo', () => {
    expect(validate([file(11 * 1024 * 1024)], '', false)).toBe(
      'file_too_large',
    );
  });

  it('refuse album somme > 10 Mo', () => {
    expect(
      validate(
        [file(6 * 1024 * 1024), file(5 * 1024 * 1024)],
        '',
        false,
      ),
    ).toBe('body_too_large');
  });

  it('refuse album 1 ou 11 éléments', () => {
    expect(validate([file(100), file(100)], '', false)).toBeNull();
    expect(validate([file(100)], '', false)).toBeNull(); // single = media not album
    const eleven = Array.from({length: 11}, () => file(100));
    expect(validate(eleven, '', false)).toBe('album_count');
  });

  it('refuse légende > 1024', () => {
    expect(validate([file(100)], 'x'.repeat(1025), false)).toBe(
      'caption_too_long',
    );
  });

  it('kind photo vs document selon MIME', () => {
    expect(kindFromMime('image/jpeg')).toBe('photo');
    expect(kindFromMime('image/png')).toBe('photo');
    expect(kindFromMime('image/webp')).toBe('photo');
    expect(kindFromMime('application/pdf')).toBe('document');
  });
});

describe('doSendMedia', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useThreadStore.setState({
      conversationId: 'c1',
      offline: false,
      items: [],
      sending: false,
      sendError: null,
    });
  });

  it('envoi réussi photo → sent', async () => {
    mockSendMedia.mockResolvedValue(
      okMsg({status: 'sent', kind: 'photo', client_message_id: 'media-uuid-0001'}),
    );
    await useThreadStore.getState().sendMedia([file(1000)], 'cap');
    expect(mockSendMedia).toHaveBeenCalled();
    expect(useThreadStore.getState().items[0]!.status).toBe('sent');
  });

  it('échec → failed sans retryable', async () => {
    mockSendMedia.mockResolvedValue(fail('QUOTA_EXCEEDED', 429));
    await useThreadStore.getState().sendMedia([file(1000)], '');
    const m = useThreadStore.getState().items[0]!;
    expect(m.status).toBe('failed');
    expect(m.retryable).toBe(false);
    expect(useThreadStore.getState().sendError).toBeTruthy();
  });

  it('hors ligne → pas de requête', async () => {
    useThreadStore.setState({offline: true});
    await useThreadStore.getState().sendMedia([file(1000)], '');
    expect(mockSendMedia).not.toHaveBeenCalled();
  });

  it('album 2 fichiers appelle sendAlbum', async () => {
    mockSendAlbum.mockResolvedValue(
      okMsg({status: 'sent', kind: 'album'}),
    );
    await useThreadStore
      .getState()
      .sendMedia([file(100), file(200)], '');
    expect(mockSendAlbum).toHaveBeenCalled();
  });

  it('PAYLOAD_TOO_LARGE / BOT_DISCONNECTED', async () => {
    mockSendMedia.mockResolvedValueOnce(fail('PAYLOAD_TOO_LARGE', 413));
    await useThreadStore.getState().sendMedia([file(100)], '');
    expect(useThreadStore.getState().sendError).toBeTruthy();
    mockSendMedia.mockResolvedValueOnce(fail('BOT_DISCONNECTED', 409));
    await useThreadStore.getState().sendMedia([file(100)], '');
    expect(useThreadStore.getState().sendError).toBeTruthy();
  });
});
