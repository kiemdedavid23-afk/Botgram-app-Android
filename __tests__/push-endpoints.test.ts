import {
  registerPushToken,
  unregisterPushToken,
} from '../src/core/api/endpoints/push';
import {authedHttp} from '../src/core/api/session';

jest.mock('../src/core/api/session', () => ({
  authedHttp: jest.fn(async () => ({ok: true, status: 200, data: {}})),
}));

const mockHttp = authedHttp as unknown as jest.Mock;

describe('endpoints push', () => {
  beforeEach(() => mockHttp.mockClear());

  it('register : POST /push/register avec jeton, fcm et appareil', async () => {
    await registerPushToken('tok', 'Android 14');
    expect(mockHttp).toHaveBeenCalledWith({
      method: 'POST',
      path: '/push/register',
      body: {token: 'tok', platform: 'fcm', device: 'Android 14'},
    });
  });

  it('unregister : POST /push/unregister avec le jeton', async () => {
    await unregisterPushToken('tok');
    expect(mockHttp).toHaveBeenCalledWith({
      method: 'POST',
      path: '/push/unregister',
      body: {token: 'tok'},
    });
  });
});
