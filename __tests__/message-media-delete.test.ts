/**
 * Supprimer un message supprime aussi son fichier média local
 * (suppression par l'utilisateur ou événement serveur) — 6bis-d.
 */
import {
  removeMessageLocally,
  removeMessageFromEvent,
} from '../src/features/thread/store/messageActions';
import {
  setMediaStorageForTests,
  resetMediaStorageForTests,
  type MediaStorage,
} from '../src/core/media/MediaStorage';
import type {Message} from '../src/core/realtime/events';

jest.mock('../src/core/api/endpoints/messages', () => ({
  deleteMessage: jest.fn(),
}));

jest.mock('../src/core/archive/hydrate', () => ({
  archiveTombstone: jest.fn(async () => undefined),
}));

function fakeStorage(del: jest.Mock): MediaStorage {
  return {
    exists: jest.fn(async () => true),
    writeBase64: jest.fn(async () => ''),
    readBase64: jest.fn(async () => null),
    delete: del,
    sizeOf: jest.fn(async () => 0),
    totalSize: jest.fn(async () => 0),
    clearAll: jest.fn(async () => undefined),
    localPath: (id: string) => `/fake/${id}`,
  };
}

function msg(id: string): Message {
  return {
    id,
    conversation_id: 'c1',
    direction: 'out',
    kind: 'photo',
    status: 'sent',
  };
}

describe('suppression de message → fichier média local', () => {
  afterEach(() => {
    resetMediaStorageForTests();
  });

  it('suppression utilisateur : fichier supprimé, autres messages gardés', () => {
    const del = jest.fn(async () => undefined);
    setMediaStorageForTests(fakeStorage(del));
    const out = removeMessageLocally([msg('m1'), msg('m2')], 'm1');
    expect(out.map(m => m.id)).toEqual(['m2']);
    expect(del).toHaveBeenCalledTimes(1);
    expect(del).toHaveBeenCalledWith('m1');
  });

  it('événement serveur deleted : fichier supprimé', () => {
    const del = jest.fn(async () => undefined);
    setMediaStorageForTests(fakeStorage(del));
    const out = removeMessageFromEvent([msg('m1')], 'm1');
    expect(out).toEqual([]);
    expect(del).toHaveBeenCalledWith('m1');
  });

  it('échec de suppression du fichier : le message est quand même retiré', () => {
    const del = jest.fn(async () => {
      throw new Error('EIO');
    });
    setMediaStorageForTests(fakeStorage(del));
    const out = removeMessageLocally([msg('m1')], 'm1');
    expect(out).toEqual([]);
  });
});
