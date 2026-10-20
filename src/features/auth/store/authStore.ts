/**
 * Store d'authentification. Tokens uniquement en Keychain.
 */
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {create} from 'zustand';
import {onSessionEvent, type SessionEndReason} from '../../../core/api/session';
import {me, logout as logoutApi, verifyCode, type Member} from '../../../core/api/endpoints/auth';
import {getRefreshToken, clearTokens, saveTokenPair} from '../../../core/storage';
import {AppState} from 'react-native';
import NetInfo from '@react-native-community/netinfo';

export type AuthState =
  | 'booting'
  | 'signedOut'
  | 'signedIn'
  | 'upgradeRequired'
  | 'accountDisabled';

type AuthStore = {
  state: AuthState;
  member: Member | null;
  offline: boolean;
  endReason: SessionEndReason | null;
  upgradeLatest: string | null;
  email: string | null;
  pendingCode: string | null;
  setEmail: (email: string | null) => void;
  setPendingCode: (code: string | null) => void;
  boot: () => Promise<void>;
  signOut: (message?: string) => Promise<void>;
  completeVerify: (result: {
    member: Member;
    access_token: string;
    refresh_token: string;
  }) => Promise<void>;
};

export const useAuthStore = create<AuthStore>(set => ({
  state: 'booting',
  member: null,
  offline: false,
  endReason: null,
  upgradeLatest: null,
  email: null,
  pendingCode: null,

  setEmail: email => set({email}),
  setPendingCode: code => set({pendingCode: code}),

  boot: async () => {
    const rt = await getRefreshToken();
    if (!rt) {
      set({state: 'signedOut', member: null});
      return;
    }
    const net = await NetInfo.fetch();
    if (!net.isConnected) {
      set({state: 'signedIn', member: null, offline: true});
      return;
    }
    const res = await me();
    if (res.ok) {
      set({state: 'signedIn', member: res.data.member, offline: false, endReason: null});
    } else if (res.error.code === 'SESSION_ENDED' || (res.status === 401 && ['revoked','session_expired','invalid','refresh_reuse'].includes((res.error.details as {reason?: string})?.reason ?? ''))) {
      await clearTokens();
      set({state: 'signedOut', member: null, endReason: (res.error.details as {reason?: SessionEndReason})?.reason ?? 'invalid'});
    } else if (res.status === 403 && res.error.code === 'ACCOUNT_DISABLED') {
      await clearTokens();
      set({state: 'accountDisabled', member: null, endReason: null});
    } else {
      set({state: 'signedIn', member: null, offline: true});
    }
  },

  signOut: async () => {
    const ac = new AbortController();
    const t = setTimeout(() => ac.abort(), 5000);
    try {
      await logoutApi();
    } catch {
      // ignore
    }
    clearTimeout(t);
    await clearTokens();
    set({state: 'signedOut', member: null, email: null, pendingCode: null, endReason: null});
  },

  completeVerify: async ({member, access_token, refresh_token}) => {
    await saveTokenPair({refreshToken: refresh_token, accessToken: access_token});
    set({state: 'signedIn', member, offline: false, endReason: null, pendingCode: null});
  },
}));

let booting = false;
async function safeBoot() {
  if (booting) return;
  booting = true;
  try {
    await useAuthStore.getState().boot();
  } finally {
    booting = false;
  }
}

NetInfo.addEventListener(state => {
  const s = useAuthStore.getState();
  if ((s.offline || s.member === null) && s.state === 'signedIn' && state.isConnected) {
    void safeBoot();
  }
});

AppState.addEventListener('change', next => {
  if (next === 'active') {
    const s = useAuthStore.getState();
    if ((s.offline || s.member === null) && s.state === 'signedIn') {
      fireAndForget(safeBoot());
    }
  }
});

onSessionEvent(event => {
  if (event.type === 'ended') {
    useAuthStore.setState({
      state: 'signedOut',
      member: null,
      endReason: event.reason,
    });
  }
  if (event.type === 'upgrade_required') {
    useAuthStore.setState({state: 'upgradeRequired', upgradeLatest: event.latest ?? null});
  }
});
