/**
 * Store d'association d'un bot existant.
 * Le jeton Telegram reste EN MÉMOIRE SEULEMENT (jamais MMKV, Keychain, logs).
 * Effacé à la réussite, à l'abandon et au passage en arrière-plan (AppState).
 *
 * Emplacement : src/features/associate/store/associateStore.ts
 * Imports core : ../../../core/... (3 niveaux vers src/)
 */
import {create} from 'zustand';
import {AppState, type AppStateStatus} from 'react-native';
import {
  previewToken,
  createBot,
  type PreviewResponse,
  type Bot,
} from '../../../core/api/endpoints/bots';
import {registerMemberDataCleaner} from '../../../core/utils/memberData';

export type AssociateStep =
  | 'intro'
  | 'ready'
  | 'token'
  | 'verify'
  | 'confirm'
  | 'done';

export type VerifyResult =
  | 'ok'
  | 'replace_required'
  | 'already_linked'
  | 'invalid'
  | 'limit'
  | 'email_not_verified'
  | 'validation'
  | 'network'
  | 'rate_limited'
  | 'duplicate'
  | 'error';

export type ConfirmResult =
  | {ok: true; bot: Bot}
  | {
      ok: false;
      reason:
        | 'replace_required'
        | 'already_linked'
        | 'limit'
        | 'invalid'
        | 'email_not_verified'
        | 'validation'
        | 'network'
        | 'rate_limited'
        | 'error'
        | 'no_token'
        | 'duplicate';
    };

type AssociateStore = {
  token: string | null;
  preview: PreviewResponse | null;
  step: AssociateStep;
  acknowledged: boolean;
  revealed: boolean;
  verifying: boolean;
  confirming: boolean;
  setStep: (s: AssociateStep) => void;
  setAcknowledged: (v: boolean) => void;
  setRevealed: (v: boolean) => void;
  setToken: (t: string) => void;
  verify: () => Promise<VerifyResult>;
  confirm: (replace?: boolean) => Promise<ConfirmResult>;
  reset: () => void;
  clearToken: () => void;
};

function mapErrorCode(code: string): VerifyResult {
  switch (code) {
    case 'TOKEN_INVALID':
      return 'invalid';
    case 'VALIDATION_ERROR':
      return 'validation';
    case 'BOT_ALREADY_LINKED':
      return 'already_linked';
    case 'BOT_LIMIT_REACHED':
      return 'limit';
    case 'EMAIL_NOT_VERIFIED':
      return 'email_not_verified';
    case 'RATE_LIMITED':
      return 'rate_limited';
    case 'network_error':
    case 'timeout':
      return 'network';
    default:
      return 'error';
  }
}

export const useAssociateStore = create<AssociateStore>((set, get) => ({
  token: null,
  preview: null,
  step: 'intro',
  acknowledged: false,
  revealed: false,
  verifying: false,
  confirming: false,

  setStep: s => set({step: s}),
  setAcknowledged: v => set({acknowledged: v}),
  setRevealed: v => set({revealed: v}),
  setToken: t => set({token: t, preview: null}),
  clearToken: () => set({token: null, revealed: false}),

  verify: async () => {
    const token = get().token;
    if (!token) {
      return 'error';
    }
    if (get().verifying) {
      return 'duplicate';
    }
    set({verifying: true});
    try {
      const res = await previewToken(token);
      if (!res.ok) {
        return mapErrorCode(res.error.code);
      }
      const data = res.data;
      set({preview: data});
      if (data.already_linked) {
        return 'already_linked';
      }
      if (data.replace_required) {
        return 'replace_required';
      }
      return 'ok';
    } finally {
      set({verifying: false});
    }
  },

  confirm: async (replace = false) => {
    const token = get().token;
    if (!token) {
      return {ok: false, reason: 'no_token'};
    }
    if (get().confirming) {
      return {ok: false, reason: 'duplicate'};
    }
    set({confirming: true});
    try {
      const res = await createBot({
        token,
        confirm_replace_webhook: replace ? true : undefined,
      });
      if (res.ok) {
        set({
          token: null,
          preview: null,
          revealed: false,
          step: 'done',
        });
        return {ok: true, bot: res.data.bot};
      }
      const code = res.error.code;
      if (code === 'WEBHOOK_REPLACE_REQUIRED') {
        return {ok: false, reason: 'replace_required'};
      }
      if (code === 'BOT_ALREADY_LINKED') {
        return {ok: false, reason: 'already_linked'};
      }
      if (code === 'BOT_LIMIT_REACHED') {
        return {ok: false, reason: 'limit'};
      }
      if (code === 'TOKEN_INVALID') {
        return {ok: false, reason: 'invalid'};
      }
      if (code === 'EMAIL_NOT_VERIFIED') {
        return {ok: false, reason: 'email_not_verified'};
      }
      if (code === 'VALIDATION_ERROR') {
        return {ok: false, reason: 'validation'};
      }
      if (code === 'RATE_LIMITED') {
        return {ok: false, reason: 'rate_limited'};
      }
      if (code === 'network_error' || code === 'timeout' || res.status === 0) {
        return {ok: false, reason: 'network'};
      }
      return {ok: false, reason: 'error'};
    } finally {
      set({confirming: false});
    }
  },

  reset: () =>
    set({
      token: null,
      preview: null,
      step: 'intro',
      acknowledged: false,
      revealed: false,
      verifying: false,
      confirming: false,
    }),
}));

/** Efface le jeton dès que l'app passe en arrière-plan / inactive. */
AppState.addEventListener('change', (next: AppStateStatus) => {
  if (next === 'background' || next === 'inactive') {
    const {token} = useAssociateStore.getState();
    if (token) {
      useAssociateStore.setState({token: null, revealed: false});
    }
  }
});

registerMemberDataCleaner(() => {
  useAssociateStore.getState().reset();
});
