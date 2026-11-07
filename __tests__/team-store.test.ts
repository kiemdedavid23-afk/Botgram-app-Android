const mockWs = {
  load: jest.fn(async () => undefined),
  upsert: jest.fn(),
};
const mockAuthSet = jest.fn();

jest.mock('../src/core/api/endpoints/team', () => ({
  listMembers: jest.fn(),
  listInvites: jest.fn(),
  setMemberRole: jest.fn(),
  removeMember: jest.fn(),
  transferOwnership: jest.fn(),
  createInvite: jest.fn(),
  revokeInvite: jest.fn(),
  patchWorkspace: jest.fn(),
}));
jest.mock('../src/core/api/endpoints/auth', () => ({me: jest.fn()}));
jest.mock('../src/features/accounts', () => ({
  useWorkspaceStore: {getState: () => mockWs},
}));
jest.mock('../src/features/auth', () => ({
  useAuthStore: {setState: (v: unknown) => mockAuthSet(v)},
}));
jest.mock('../src/core/utils/memberData', () => ({registerMemberDataCleaner: jest.fn()}));

import * as api from '../src/core/api/endpoints/team';
import {me} from '../src/core/api/endpoints/auth';
import {useTeamStore} from '../src/features/team/store/teamStore';

const ok = <T,>(data: T) => ({ok: true as const, data, status: 200, requestId: null, headers: new Headers()});
const ko = (code: string, status = 409, details?: unknown) => ({
  ok: false as const,
  error: {code, message: code, details},
  status,
  requestId: null,
  headers: new Headers(),
});
const m = (id: string, role: 'owner' | 'agent' | 'viewer') => ({member_id: id, display_name: id, role, joined_at: 1});

describe('teamStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useTeamStore.getState().clear();
    (api.listMembers as jest.Mock).mockResolvedValue(ok({members: [m('o', 'owner'), m('a', 'agent')]}));
    (api.listInvites as jest.Mock).mockResolvedValue(ok({invites: []}));
  });

  it('charge les personnes et les invitations', async () => {
    await useTeamStore.getState().load('c_1', {force: true, withInvites: true});
    expect(useTeamStore.getState().members).toHaveLength(2);
    expect(api.listInvites).toHaveBeenCalledTimes(1);
  });

  it('un lecteur ne lit pas les invitations', async () => {
    await useTeamStore.getState().load('c_1', {force: true});
    expect(api.listInvites).not.toHaveBeenCalled();
  });

  it('refus du Worker : message lisible, aucun changement local', async () => {
    (api.createInvite as jest.Mock).mockResolvedValue(ko('INVITE_EMAIL_REGISTERED'));
    const res = await useTeamStore.getState().invite('c_1', 'x@y.com', 'agent', false);
    expect(res.ok).toBe(false);
    expect(!res.ok && res.message).toContain('déjà un compte');
    expect(useTeamStore.getState().busy).toBeNull();
  });

  it('FORBIDDEN relit espaces et listes', async () => {
    (api.setMemberRole as jest.Mock).mockResolvedValue(ko('FORBIDDEN', 403));
    await useTeamStore.getState().changeRole('c_1', 'a', 'viewer');
    expect(mockWs.load).toHaveBeenCalledWith(true);
  });

  it('changement de rôle réussi : mis à jour sans relire', async () => {
    await useTeamStore.getState().load('c_1', {force: true});
    (api.setMemberRole as jest.Mock).mockResolvedValue(ok({member_id: 'a', role: 'viewer'}));
    const res = await useTeamStore.getState().changeRole('c_1', 'a', 'viewer');
    expect(res.ok).toBe(true);
    expect(useTeamStore.getState().members.find(x => x.member_id === 'a')?.role).toBe('viewer');
  });

  it('transfert : espace remplacé, membre relu', async () => {
    const ws = {id: 'c_1'};
    (api.transferOwnership as jest.Mock).mockResolvedValue(ok({workspace: ws}));
    (me as jest.Mock).mockResolvedValue(ok({member: {id: 'me', account_type: 'invited'}}));
    const res = await useTeamStore.getState().transfer('c_1', 'a');
    expect(res.ok).toBe(true);
    expect(mockWs.upsert).toHaveBeenCalledWith(ws);
    expect(mockAuthSet).toHaveBeenCalledWith({member: {id: 'me', account_type: 'invited'}});
  });

  it('retrait : indique si le compte a été supprimé', async () => {
    (api.removeMember as jest.Mock).mockResolvedValue(ok({removed: true, account_deleted: true}));
    const res = await useTeamStore.getState().remove('c_1', 'a');
    expect(res.ok && res.data.accountDeleted).toBe(true);
  });

  it('une action à la fois', async () => {
    let release: (v: unknown) => void = () => undefined;
    (api.revokeInvite as jest.Mock).mockReturnValue(new Promise(r => (release = r)));
    const first = useTeamStore.getState().revoke('c_1', 'i1');
    const second = await useTeamStore.getState().revoke('c_1', 'i2');
    expect(second.ok).toBe(false);
    release(ok({revoked: true}));
    await first;
  });
});
