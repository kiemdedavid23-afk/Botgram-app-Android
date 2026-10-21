/**
 * Tests L3c — format profil + store modification / suppression / code_length.
 */
import {http} from '../src/core/api/http';
import * as storage from '../src/core/storage';
import {useMemberStore} from '../src/features/member/store/memberStore';
import {useAuthStore} from '../src/features/auth/store/authStore';
import {
  statusLabel,
  statusTone,
  usageLabel,
  countryLabel,
  formatPhone,
  memberSince,
  memberInitial,
} from '../src/features/member/utils/format';

jest.mock('../src/core/storage');
jest.mock('../src/core/api/http');

const mockHttp = http as jest.MockedFunction<typeof http>;
const mockClearTokens = storage.clearTokens as jest.Mock;

function ok<T>(data: T, status = 200): Awaited<ReturnType<typeof http>> {
  return {
    ok: true,
    data,
    status,
    headers: new Headers(),
    requestId: null,
  };
}

function fail(
  status: number,
  code: string,
  details?: unknown,
): Awaited<ReturnType<typeof http>> {
  return {
    ok: false,
    error: {code, message: '', details},
    status,
    headers: new Headers(),
    requestId: null,
  };
}

const sampleMember = {
  id: 'm1',
  email: 'a@b.c',
  email_verified: true,
  display_name: 'Alice',
  role: 'member',
  status: 'active',
  country: 'BF' as string | null,
  usage: 'boutique' as string | null,
  phone: '+22670123456' as string | null,
  organization: 'Org' as string | null,
  selected_bot_id: null as string | null,
  created_at: Date.UTC(2025, 9, 1),
};

beforeEach(() => {
  jest.resetAllMocks();
  mockClearTokens.mockResolvedValue(undefined);
  mockHttp.mockReset();
  useMemberStore.getState().clear();
  useAuthStore.setState({
    state: 'signedIn',
    member: sampleMember,
    offline: false,
  });
});

describe('format profil', () => {
  it('statusLabel / statusTone', () => {
    expect(statusLabel('active')).toBe('Actif');
    expect(statusTone('active')).toBe('good');
    expect(statusTone('pending')).toBe('warn');
    expect(statusTone('suspended')).toBe('bad');
  });

  it('usageLabel capitalise', () => {
    expect(usageLabel('boutique')).toBe('Boutique');
    expect(usageLabel(null)).toBe('');
  });

  it('countryLabel avec drapeau', () => {
    const label = countryLabel('BF');
    expect(label).toContain('Burkina Faso');
    expect(countryLabel(null)).toBe('');
  });

  it('formatPhone BF et FR', () => {
    expect(formatPhone('+22670123456')).toBe('+226 70 12 34 56');
    expect(formatPhone('+33612345678')).toMatch(/^\+33 /);
    expect(formatPhone(null)).toBe('');
  });

  it('memberSince et initial', () => {
    expect(memberSince(Date.UTC(2025, 9, 1))).toMatch(/2025/);
    expect(memberInitial('Alice')).toBe('A');
    expect(memberInitial('')).toBe('?');
  });
});

describe('updateProfile', () => {
  it('succès synchronise member et authStore', async () => {
    const updated = {...sampleMember, display_name: 'Bob'};
    mockHttp.mockResolvedValueOnce(ok({member: updated}));
    useMemberStore.getState().setMember(sampleMember);
    const r = await useMemberStore.getState().updateProfile({
      display_name: 'Bob',
    });
    expect(r).toBe('ok');
    expect(useMemberStore.getState().member?.display_name).toBe('Bob');
    expect(useAuthStore.getState().member?.display_name).toBe('Bob');
  });

  it('VALIDATION_ERROR remplit fieldErrors', async () => {
    mockHttp.mockResolvedValueOnce(
      fail(400, 'VALIDATION_ERROR', {
        fields: {display_name: 'Trop court'},
      }),
    );
    useMemberStore.getState().setMember(sampleMember);
    const r = await useMemberStore.getState().updateProfile({
      display_name: 'x',
    });
    expect(r).toBe('validation');
    expect(useMemberStore.getState().fieldErrors.display_name).toBe(
      'Trop court',
    );
  });
});

describe('suppression compte', () => {
  it('request stocke code_length du Worker', async () => {
    mockHttp.mockResolvedValueOnce(
      ok({requested: true, expires_in: 600, code_length: 8}, 202),
    );
    const r = await useMemberStore.getState().requestAccountDelete();
    expect(r).toBe('ok');
    expect(useMemberStore.getState().deletePhase).toBe('code_sent');
    expect(useMemberStore.getState().deleteCodeLength).toBe(8);
  });

  it('code invalide reste en phase code_sent', async () => {
    mockHttp
      .mockResolvedValueOnce(
        ok({requested: true, expires_in: 600, code_length: 6}, 202),
      )
      .mockResolvedValueOnce(fail(400, 'CODE_INVALID'));
    await useMemberStore.getState().requestAccountDelete();
    const r = await useMemberStore.getState().confirmAccountDelete('000000');
    expect(r).toBe('code_invalid');
    expect(useMemberStore.getState().deletePhase).toBe('code_sent');
  });

  it('resetDelete efface la phase', () => {
    useMemberStore.setState({
      deletePhase: 'code_sent',
      deleteError: 'CODE_INVALID',
      deleteCodeLength: 8,
    });
    useMemberStore.getState().resetDelete();
    expect(useMemberStore.getState().deletePhase).toBe('idle');
    expect(useMemberStore.getState().deleteError).toBeNull();
    expect(useMemberStore.getState().deleteCodeLength).toBe(6);
  });

  it('double-envoi : génération ignore réponse obsolète', async () => {
    let resolveFirst: (v: unknown) => void = () => {};
    const first = new Promise(res => {
      resolveFirst = res;
    });
    mockHttp.mockImplementationOnce(() => first as never);
    const p1 = useMemberStore.getState().requestAccountDelete();
    useMemberStore.getState().clear();
    resolveFirst(ok({requested: true, expires_in: 1, code_length: 6}, 202));
    const r = await p1;
    expect(r).toBe('error');
    expect(useMemberStore.getState().deletePhase).toBe('idle');
  });
});
