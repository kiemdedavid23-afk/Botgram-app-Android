/**
 * Équipe de l'entreprise : personnes et invitations en attente.
 * Mémoire seulement (pas de cache disque : ce sont des données de gestion),
 * single-flight, génération anti-fuite, vidé à la déconnexion.
 */
import {create} from 'zustand';
import {
  listMembers,
  listInvites,
  setMemberRole,
  removeMember,
  transferOwnership,
  createInvite,
  revokeInvite,
  patchWorkspace,
  type Invite,
  type InviteRole,
  type TeamMember,
  type CreatedInvite,
  type WorkspacePatch,
} from '../../../core/api/endpoints/team';
import {me} from '../../../core/api/endpoints/auth';
import {useAuthStore} from '../../auth';
import {useWorkspaceStore} from '../../accounts';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';
import {describeTeamError} from '../utils/teamLogic';

const TTL_MS = 60 * 1000;

export type ActionResult<T = undefined> =
  | {ok: true; data: T}
  | {ok: false; message: string};

type TeamStore = {
  workspaceId: string | null;
  members: TeamMember[];
  invites: Invite[];
  loaded: boolean;
  loading: boolean;
  offline: boolean;
  lastFetch: number;
  generation: number;
  /** Clé de l'action en cours (« role:id », « invite », …). */
  busy: string | null;
  load: (workspaceId: string, opts?: {force?: boolean; withInvites?: boolean}) => Promise<void>;
  invite: (
    workspaceId: string,
    email: string,
    role: InviteRole,
    sendEmail: boolean,
  ) => Promise<ActionResult<CreatedInvite>>;
  revoke: (workspaceId: string, inviteId: string) => Promise<ActionResult>;
  changeRole: (workspaceId: string, memberId: string, role: InviteRole) => Promise<ActionResult>;
  remove: (workspaceId: string, memberId: string) => Promise<ActionResult<{accountDeleted: boolean}>>;
  transfer: (workspaceId: string, memberId: string) => Promise<ActionResult>;
  editCompany: (workspaceId: string, patch: WorkspacePatch) => Promise<ActionResult>;
  clear: () => void;
};

let inflight: Promise<void> | null = null;

export const useTeamStore = create<TeamStore>((set, get) => {
  /** Relit les listes après une action ou une erreur « introuvable » : l'écran reste juste. */
  const refresh = (workspaceId: string) =>
    get().load(workspaceId, {force: true, withInvites: true});

  const fail = <T,>(
    res: {error: {code: string; details?: unknown}; status: number},
    workspaceId: string,
  ): ActionResult<T> => {
    if (res.error.code === 'NOT_FOUND' || res.error.code === 'FORBIDDEN') {
      void refresh(workspaceId);
      void useWorkspaceStore.getState().load(true);
    }
    return {ok: false, message: describeTeamError(res.error.code, res.error.details)};
  };

  const run = async <T,>(
    key: string,
    fn: () => Promise<ActionResult<T>>,
  ): Promise<ActionResult<T>> => {
    if (get().busy) {
      return {ok: false, message: 'Une action est déjà en cours.'};
    }
    const gen = get().generation;
    set({busy: key});
    try {
      return await fn();
    } finally {
      if (get().generation === gen) set({busy: null});
    }
  };

  return {
    workspaceId: null,
    members: [],
    invites: [],
    loaded: false,
    loading: false,
    offline: false,
    lastFetch: 0,
    generation: 0,
    busy: null,

    load: async (workspaceId, opts = {}) => {
      const {force = false, withInvites = false} = opts;
      // Une lecture déjà partie peut précéder l'action : on la laisse finir, puis on relit si forcé.
      if (inflight) {
        await inflight;
        if (!force) return;
      }
      const s = get();
      if (
        !force &&
        s.loaded &&
        s.workspaceId === workspaceId &&
        Date.now() - s.lastFetch < TTL_MS
      ) {
        return;
      }
      const gen = s.generation;
      inflight = (async () => {
        set({loading: true});
        const [m, i] = await Promise.all([
          listMembers(workspaceId),
          withInvites ? listInvites(workspaceId) : Promise.resolve(null),
        ]);
        if (get().generation !== gen) return;
        if (!m.ok) {
          set({loading: false, offline: m.status === 0 || m.status >= 500});
          return;
        }
        set({
          workspaceId,
          members: m.data.members,
          invites: i && i.ok ? i.data.invites : withInvites ? get().invites : [],
          loaded: true,
          loading: false,
          offline: false,
          lastFetch: Date.now(),
        });
      })().finally(() => {
        inflight = null;
      });
      return inflight;
    },

    invite: (workspaceId, email, role, sendEmail) =>
      run('invite', async () => {
        const res = await createInvite(workspaceId, {email, role, send_email: sendEmail});
        if (!res.ok) return fail(res, workspaceId);
        await refresh(workspaceId);
        void useWorkspaceStore.getState().load(true);
        return {ok: true, data: res.data};
      }),

    revoke: (workspaceId, inviteId) =>
      run(`revoke:${inviteId}`, async () => {
        const res = await revokeInvite(workspaceId, inviteId);
        if (!res.ok) return fail(res, workspaceId);
        await refresh(workspaceId);
        void useWorkspaceStore.getState().load(true);
        return {ok: true, data: undefined};
      }),

    changeRole: (workspaceId, memberId, role) =>
      run(`role:${memberId}`, async () => {
        const res = await setMemberRole(workspaceId, memberId, role);
        if (!res.ok) return fail(res, workspaceId);
        set(s => ({
          members: s.members.map(x => (x.member_id === memberId ? {...x, role} : x)),
        }));
        return {ok: true, data: undefined};
      }),

    remove: (workspaceId, memberId) =>
      run(`remove:${memberId}`, async () => {
        const res = await removeMember(workspaceId, memberId);
        if (!res.ok) return fail(res, workspaceId);
        await refresh(workspaceId);
        void useWorkspaceStore.getState().load(true);
        return {ok: true, data: {accountDeleted: res.data.account_deleted}};
      }),

    transfer: (workspaceId, memberId) =>
      run(`transfer:${memberId}`, async () => {
        const res = await transferOwnership(workspaceId, memberId);
        if (!res.ok) return fail(res, workspaceId);
        // L'ancien propriétaire devient invité : espace puis type de compte sont relus.
        useWorkspaceStore.getState().upsert(res.data.workspace);
        await useWorkspaceStore.getState().load(true);
        const mine = await me();
        if (mine.ok) useAuthStore.setState({member: mine.data.member});
        await refresh(workspaceId);
        return {ok: true, data: undefined};
      }),

    editCompany: (workspaceId, patch) =>
      run('company', async () => {
        const res = await patchWorkspace(workspaceId, patch);
        if (!res.ok) return fail(res, workspaceId);
        useWorkspaceStore.getState().upsert(res.data.workspace);
        return {ok: true, data: undefined};
      }),

    clear: () => {
      inflight = null;
      set(s => ({
        workspaceId: null,
        members: [],
        invites: [],
        loaded: false,
        loading: false,
        offline: false,
        lastFetch: 0,
        busy: null,
        generation: s.generation + 1,
      }));
    },
  };
});

registerMemberDataCleaner(() => {
  useTeamStore.getState().clear();
});
