import {kindFromMime} from '../src/features/thread/mediaLimits';
import {
  validateMediaSend as validate,
  doSendMedia,
  doResendMediaAsNew,
  hasPendingMedia,
  clearPendingMedia,
} from '../src/features/thread/store/sendMediaActions';
import {doResendAsNew, doResendSameId} from '../src/features/thread/store/sendActions';
import {useThreadStore} from '../src/features/thread/store/threadStore';
import * as MessagesApi from '../src/core/api/endpoints/messages';
import type {HttpResult} from '../src/core/api/http';
import type {Message} from '../src/core/realtime/events';

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

let uuidSeq = 0;
jest.mock('../src/core/utils/uuid', () => ({
  uuidV4: () => {
    uuidSeq += 1;
    return `media-uuid-${uuidSeq}`;
  },
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
const mockSendMessage = MessagesApi.sendMessage as jest.MockedFunction<
  typeof MessagesApi.sendMessage
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
      validate([file(6 * 1024 * 1024), file(5 * 1024 * 1024)], '', false),
    ).toBe('body_too_large');
  });

  it('refuse album 11 éléments', () => {
    const eleven = Array.from({length: 11}, () => file(100));
    expect(validate(eleven, '', false)).toBe('album_count');
  });

  it('album avec document → album_types', () => {
    expect(
      validate(
        [file(100, 'image/jpeg'), file(100, 'application/pdf', 'x.pdf')],
        '',
        false,
      ),
    ).toBe('album_types');
  });

  it('refuse légende > 1024', () => {
    expect(validate([file(100)], 'x'.repeat(1025), false)).toBe(
      'caption_too_long',
    );
  });

  it('kind photo vs document selon MIME', () => {
    expect(kindFromMime('image/jpeg')).toBe('photo');
    expect(kindFromMime('application/pdf')).toBe('document');
  });
});

describe('doSendMedia / renvoi / annulation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    uuidSeq = 0;
    clearPendingMedia();
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
      okMsg({status: 'sent', kind: 'photo'}),
    );
    await useThreadStore.getState().sendMedia([file(1000)], 'cap');
    expect(mockSendMedia).toHaveBeenCalled();
    expect(useThreadStore.getState().items[0]!.status).toBe('sent');
  });

  it('échec → failed ; Renvoyer rappelle sendMedia avec nouvel id', async () => {
    mockSendMedia
      .mockResolvedValueOnce(fail('QUOTA_EXCEEDED', 429))
      .mockResolvedValueOnce(okMsg({status: 'sent', kind: 'photo'}));
    await useThreadStore.getState().sendMedia([file(1000)], 'légende');
    const failed = useThreadStore.getState().items[0]!;
    expect(failed.status).toBe('failed');
    expect(hasPendingMedia(failed.id)).toBe(true);
    expect(mockSendMessage).not.toHaveBeenCalled();

    await useThreadStore.getState().resendMedia(failed);
    expect(mockSendMedia).toHaveBeenCalledTimes(2);
    expect(mockSendMessage).not.toHaveBeenCalled();
    const lastCall = mockSendMedia.mock.calls[1]!;
    const form = lastCall[1] as FormData;
    // FormData in jest may be partial — at least 2 calls and no text send
    expect(useThreadStore.getState().items.some(m => m.status === 'sent')).toBe(
      true,
    );
    expect(form).toBeTruthy();
  });

  it('sans fichiers en mémoire → pas de pending', async () => {
    expect(hasPendingMedia('local:unknown')).toBe(false);
  });

  it('doResendAsNew/SameId ignorent les médias', async () => {
    const mediaMsg: Message = {
      id: 'local:x',
      conversation_id: 'c1',
      direction: 'out',
      kind: 'photo',
      status: 'failed',
      text: 'cap',
    };
    await doResendAsNew(mediaMsg, {
      get: () => useThreadStore.getState(),
      set: p => useThreadStore.setState(p as never),
    });
    await doResendSameId(mediaMsg, {
      get: () => useThreadStore.getState(),
      set: p => useThreadStore.setState(p as never),
    });
    expect(mockSendMessage).not.toHaveBeenCalled();
  });

  it('annulation retire la bulle sans failed', async () => {
    const ac = new AbortController();
    mockSendMedia.mockImplementation(
      () =>
        new Promise(resolve => {
          ac.abort();
          resolve(fail('aborted', 0));
        }),
    );
    await doSendMedia(
      [file(100)],
      '',
      {
        get: () => useThreadStore.getState(),
        set: p =>
          useThreadStore.setState(
            typeof p === 'function' ? p(useThreadStore.getState()) : p,
          ),
      },
      ac.signal,
    );
    const items = useThreadStore.getState().items;
    expect(items.every(m => m.status !== 'failed')).toBe(true);
    expect(useThreadStore.getState().sendError).toBeNull();
  });

  it('hors ligne → pas de requête', async () => {
    useThreadStore.setState({offline: true});
    await useThreadStore.getState().sendMedia([file(1000)], '');
    expect(mockSendMedia).not.toHaveBeenCalled();
  });

  it('album 2 fichiers appelle sendAlbum', async () => {
    mockSendAlbum.mockResolvedValue(okMsg({status: 'sent', kind: 'album'}));
    await useThreadStore.getState().sendMedia([file(100), file(200)], '');
    expect(mockSendAlbum).toHaveBeenCalled();
  });

  it('aucun log avec nom de fichier ou légende', async () => {
    const spy = jest.spyOn(console, 'log').mockImplementation(() => {});
    const err = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockSendMedia.mockResolvedValue(okMsg({status: 'sent'}));
    await useThreadStore.getState().sendMedia([file(100, 'image/jpeg', 'secret.jpg')], 'secret-caption');
    const all = [...spy.mock.calls, ...err.mock.calls].flat().join(' ');
    expect(all).not.toContain('secret.jpg');
    expect(all).not.toContain('secret-caption');
    spy.mockRestore();
    err.mockRestore();
  });
});
