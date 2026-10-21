/**
 * Tests store association : succès, erreurs, nettoyage jeton, abandon.
 */
const mockPreview = jest.fn();
const mockCreate = jest.fn();

jest.mock('../src/core/api/endpoints/bots', () => ({
  previewToken: (...a: unknown[]) => mockPreview(...a),
  createBot: (...a: unknown[]) => mockCreate(...a),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: (fn: () => void) => {
    (globalThis as {__cleaner?: () => void}).__cleaner = fn;
    return () => undefined;
  },
}));

import {useAssociateStore} from '../src/features/associate/store/associateStore';

beforeEach(() => {
  jest.clearAllMocks();
  useAssociateStore.getState().reset();
});

describe('associateStore', () => {
  it('verify success sets preview', async () => {
    mockPreview.mockResolvedValue({
      ok: true,
      data: {
        telegram_bot_id: 1,
        username: 'mybot',
        name: 'My Bot',
        webhook_set: false,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: false,
      },
    });
    useAssociateStore.getState().setToken('123:ABC');
    const r = await useAssociateStore.getState().verify();
    expect(r).toBe('ok');
    expect(useAssociateStore.getState().preview?.username).toBe('mybot');
  });

  it('verify invalid token', async () => {
    mockPreview.mockResolvedValue({
      ok: false,
      error: {code: 'TOKEN_INVALID'},
      status: 400,
    });
    useAssociateStore.getState().setToken('bad');
    expect(await useAssociateStore.getState().verify()).toBe('invalid');
  });

  it('verify already linked', async () => {
    mockPreview.mockResolvedValue({
      ok: true,
      data: {
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: true,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: true,
      },
    });
    useAssociateStore.getState().setToken('123:ABC');
    expect(await useAssociateStore.getState().verify()).toBe('already_linked');
  });

  it('verify replace_required', async () => {
    mockPreview.mockResolvedValue({
      ok: true,
      data: {
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: true,
        webhook_is_botgram: false,
        replace_required: true,
        already_linked: false,
      },
    });
    useAssociateStore.getState().setToken('123:ABC');
    expect(await useAssociateStore.getState().verify()).toBe(
      'replace_required',
    );
  });

  it('verify BOT_LIMIT_REACHED', async () => {
    mockPreview.mockResolvedValue({
      ok: false,
      error: {code: 'BOT_LIMIT_REACHED'},
      status: 403,
    });
    useAssociateStore.getState().setToken('123:ABC');
    expect(await useAssociateStore.getState().verify()).toBe('limit');
  });

  it('confirm success clears token', async () => {
    mockCreate.mockResolvedValue({
      ok: true,
      data: {bot: {id: 'b1', name: 'Bot'}},
    });
    useAssociateStore.getState().setToken('123:ABC');
    const res = await useAssociateStore.getState().confirm();
    expect(res.ok).toBe(true);
    expect(useAssociateStore.getState().token).toBeNull();
  });

  it('confirm BOT_LIMIT_REACHED', async () => {
    mockCreate.mockResolvedValue({
      ok: false,
      error: {code: 'BOT_LIMIT_REACHED'},
      status: 403,
    });
    useAssociateStore.getState().setToken('123:ABC');
    const res = await useAssociateStore.getState().confirm();
    expect(res.ok).toBe(false);
    if (!res.ok) {
      expect(res.reason).toBe('limit');
    }
  });

  it('duplicate verify returns duplicate', async () => {
    let resolvePreview: (v: unknown) => void = () => undefined;
    mockPreview.mockReturnValue(
      new Promise(r => {
        resolvePreview = r;
      }),
    );
    useAssociateStore.getState().setToken('123:ABC');
    const p1 = useAssociateStore.getState().verify();
    const p2 = useAssociateStore.getState().verify();
    resolvePreview({
      ok: true,
      data: {
        telegram_bot_id: 1,
        username: 'x',
        name: 'X',
        webhook_set: false,
        webhook_is_botgram: false,
        replace_required: false,
        already_linked: false,
      },
    });
    expect(await p2).toBe('duplicate');
    expect(await p1).toBe('ok');
  });

  it('reset clears token and acknowledged', () => {
    useAssociateStore.getState().setToken('secret');
    useAssociateStore.getState().setAcknowledged(true);
    useAssociateStore.getState().reset();
    expect(useAssociateStore.getState().token).toBeNull();
    expect(useAssociateStore.getState().acknowledged).toBe(false);
  });

  it('clearToken removes token from memory', () => {
    useAssociateStore.getState().setToken('secret-token');
    useAssociateStore.getState().clearToken();
    expect(useAssociateStore.getState().token).toBeNull();
    expect(useAssociateStore.getState().revealed).toBe(false);
  });

  it('abandon resets token when leaving flow', () => {
    useAssociateStore.getState().setToken('secret-abandon');
    useAssociateStore.getState().setAcknowledged(true);
    useAssociateStore.getState().reset();
    expect(useAssociateStore.getState().token).toBeNull();
    expect(useAssociateStore.getState().acknowledged).toBe(false);
    expect(useAssociateStore.getState().preview).toBeNull();
  });
});
