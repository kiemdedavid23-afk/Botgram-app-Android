import {
  setupPush,
  unregisterPush,
  watchTokenRefresh,
} from '../src/core/push/pushRegistration';
import * as client from '../src/core/push/pushClient';
import {registerPushToken, unregisterPushToken} from '../src/core/api/endpoints/push';
import {cacheGetNumber, cacheSetNumber} from '../src/core/storage';
import {clearMemberData} from '../src/core/utils/memberData';

jest.mock('../src/core/push/pushClient');
jest.mock('../src/core/api/endpoints/push', () => ({
  registerPushToken: jest.fn(async () => ({ok: true})),
  unregisterPushToken: jest.fn(async () => ({ok: true})),
}));
jest.mock('../src/core/storage', () => ({
  cacheGetNumber: jest.fn(async () => null),
  cacheSetNumber: jest.fn(async () => undefined),
}));

const c = client as jest.Mocked<typeof client>;
const reg = registerPushToken as jest.Mock;
const unreg = unregisterPushToken as jest.Mock;
const getAsked = cacheGetNumber as jest.Mock;
const setAsked = cacheSetNumber as jest.Mock;

beforeEach(async () => {
  jest.clearAllMocks();
  await clearMemberData();
  c.ensureChannels.mockResolvedValue(undefined);
  c.hasNotificationPermission.mockResolvedValue(true);
  c.requestNotificationPermission.mockResolvedValue(true);
  c.getPushToken.mockResolvedValue('tok1');
  c.deletePushToken.mockResolvedValue(undefined);
  getAsked.mockResolvedValue(null);
  reg.mockResolvedValue({ok: true});
});

describe('setupPush', () => {
  it('permission déjà accordée : canaux puis enregistrement du jeton', async () => {
    expect(await setupPush()).toBe(true);
    expect(c.ensureChannels).toHaveBeenCalled();
    expect(c.requestNotificationPermission).not.toHaveBeenCalled();
    expect(reg).toHaveBeenCalledWith('tok1', expect.stringContaining('Android'));
  });

  it('le même jeton n’est pas renvoyé deux fois', async () => {
    await setupPush();
    await setupPush();
    expect(reg).toHaveBeenCalledTimes(1);
  });

  it('un échec d’enregistrement est retenté au prochain appel', async () => {
    reg.mockResolvedValueOnce({ok: false});
    await setupPush();
    await setupPush();
    expect(reg).toHaveBeenCalledTimes(2);
  });

  it('permission à demander : demandée une seule fois, puis jeton si accordée', async () => {
    c.hasNotificationPermission.mockResolvedValue(false);
    expect(await setupPush()).toBe(true);
    expect(setAsked).toHaveBeenCalled();
    expect(c.requestNotificationPermission).toHaveBeenCalledTimes(1);
    expect(reg).toHaveBeenCalled();
  });

  it('permission refusée : rien n’est enregistré', async () => {
    c.hasNotificationPermission.mockResolvedValue(false);
    c.requestNotificationPermission.mockResolvedValue(false);
    expect(await setupPush()).toBe(false);
    expect(reg).not.toHaveBeenCalled();
  });

  it('déjà demandée avant : pas de nouvelle demande', async () => {
    c.hasNotificationPermission.mockResolvedValue(false);
    getAsked.mockResolvedValue(1);
    expect(await setupPush()).toBe(false);
    expect(c.requestNotificationPermission).not.toHaveBeenCalled();
  });
});

describe('watchTokenRefresh', () => {
  it('renvoie le nouveau jeton au Worker', async () => {
    let cb: (t: string) => void = () => undefined;
    c.onPushTokenRefresh.mockImplementation(f => {
      cb = f;
      return () => undefined;
    });
    await setupPush();
    watchTokenRefresh();
    cb('tok2');
    await Promise.resolve();
    await Promise.resolve();
    expect(reg).toHaveBeenLastCalledWith('tok2', expect.any(String));
  });
});

describe('unregisterPush', () => {
  it('jamais enregistré : aucun appel', async () => {
    await unregisterPush();
    expect(unreg).not.toHaveBeenCalled();
    expect(c.deletePushToken).not.toHaveBeenCalled();
  });

  it('enregistré : désenregistre côté Worker puis détruit le jeton local', async () => {
    await setupPush();
    await unregisterPush();
    expect(unreg).toHaveBeenCalledWith('tok1');
    expect(c.deletePushToken).toHaveBeenCalled();
  });

  it('clearMemberData oublie le jeton enregistré', async () => {
    await setupPush();
    await clearMemberData();
    await unregisterPush();
    expect(unreg).not.toHaveBeenCalled();
  });
});
