/**
 * Mises à jour : niveau (none / optional / required), dernière version connue, « Plus tard ».
 * Sources : en-tête X-App-Update (chaque réponse), 426, et GET /app/updates (vérification active).
 */
import {AppState, Linking} from 'react-native';
import {create} from 'zustand';
import {onSessionEvent} from '../../core/api/session';
import {fetchUpdateCheck} from '../../core/api/endpoints/appUpdates';
import {
  parseLatest,
  toUpdateLevel,
  type LatestBuild,
  type UpdateLevel,
} from '../../core/update/latest';
import {cacheGetNumber, cacheSetNumber} from '../../core/storage';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {env} from '../../core/config/env';
import {useAuthStore} from '../auth/store/authStore';
import {
  canInstallApks,
  cancelDownload,
  cleanupApk,
  downloadApk,
  installApk,
  isInstallerAvailable,
  openInstallSettings,
} from './installer';
import {updateTexts as t} from './texts';

const DISMISS_KEY = 'update.dismissedCode';
const EVENT_CHECK_MIN_MS = 60_000;

export type CheckResult = 'idle' | 'uptodate' | 'available' | 'failed';

export type InstallPhase =
  | 'idle'
  | 'needsPermission'
  | 'downloading'
  | 'installing'
  | 'error';

function installErrorText(e: unknown): string | null {
  const code = (e as {code?: string} | null)?.code;
  switch (code) {
    case 'cancelled':
      return null;
    case 'hash_mismatch':
    case 'size_mismatch':
    case 'hash_missing':
      return t.errInvalidFile;
    case 'wrong_package':
      return t.errWrongPackage;
    case 'http_error':
    case 'download_failed':
      return t.errNetwork;
    default:
      return t.errGeneric;
  }
}

type UpdateStore = {
  level: UpdateLevel;
  latest: LatestBuild | null;
  checking: boolean;
  checkedAt: number;
  result: CheckResult;
  /** version_code pour lequel « Plus tard » a été choisi (-1 si inconnu). */
  dismissedCode: number | null;
  installPhase: InstallPhase;
  /** 0..1 pendant le téléchargement (0 = taille inconnue). */
  progress: number;
  installError: string | null;
  /** Canal direct : télécharge, vérifie et installe. Sinon ouvre le lien. */
  startUpdate: () => Promise<void>;
  cancelUpdate: () => void;
  check: (manual?: boolean) => Promise<void>;
  dismiss: () => void;
  openDownload: () => Promise<boolean>;
};

function forceUpgrade(latest: LatestBuild | null): void {
  useAuthStore.setState({
    state: 'upgradeRequired',
    upgradeLatest: latest?.version_name ?? null,
  });
}

export const useUpdateStore = create<UpdateStore>((set, get) => ({
  level: 'none',
  latest: null,
  checking: false,
  checkedAt: 0,
  result: 'idle',
  dismissedCode: null,
  installPhase: 'idle',
  progress: 0,
  installError: null,

  async startUpdate() {
    const {latest, installPhase} = get();
    if (!latest?.download_url) return;
    if (installPhase === 'downloading' || installPhase === 'installing') return;

    const canInApp =
      env.appChannel === 'direct' && isInstallerAvailable() && !!latest.sha256;
    if (!canInApp) {
      await get().openDownload();
      return;
    }

    set({installError: null});
    if (!(await canInstallApks())) {
      set({installPhase: 'needsPermission'});
      // Au retour des réglages, on reprend automatiquement.
      const sub = AppState.addEventListener('change', next => {
        if (next !== 'active') return;
        sub.remove();
        fireAndForget(
          canInstallApks().then(ok => {
            if (ok) return get().startUpdate();
            set({installPhase: 'error', installError: t.errPermission});
            return undefined;
          }),
        );
      });
      try {
        await openInstallSettings();
      } catch {
        sub.remove();
        set({installPhase: 'error', installError: t.errGeneric});
      }
      return;
    }

    set({installPhase: 'downloading', progress: 0});
    try {
      await downloadApk(
        latest.download_url,
        latest.sha256 ?? '',
        latest.size_bytes ?? 0,
        p => set({progress: p}),
      );
      set({installPhase: 'installing', progress: 1});
      await installApk();
      // L'installateur Android prend le relais ; on revient à l'état normal.
      set({installPhase: 'idle', progress: 0});
    } catch (e) {
      const msg = installErrorText(e);
      set({
        installPhase: msg ? 'error' : 'idle',
        installError: msg,
        progress: 0,
      });
    }
  },

  cancelUpdate() {
    fireAndForget(cancelDownload());
  },

  async check(manual = false) {
    if (get().checking) return;
    set({checking: true, result: manual ? 'idle' : get().result});
    const res = await fetchUpdateCheck();
    if (!res.ok) {
      set({
        checking: false,
        checkedAt: Date.now(),
        result: manual ? 'failed' : get().result,
      });
      return;
    }
    const level = toUpdateLevel(res.data.update);
    const latest = parseLatest(res.data.latest) ?? null;
    set({
      checking: false,
      checkedAt: Date.now(),
      level,
      latest,
      result: level === 'none' ? 'uptodate' : 'available',
    });
    if (level === 'required') forceUpgrade(latest);
  },

  dismiss() {
    const code = get().latest?.version_code ?? -1;
    set({dismissedCode: code});
    fireAndForget(cacheSetNumber(DISMISS_KEY, code));
  },

  async openDownload() {
    const url = get().latest?.download_url;
    if (!url) return false;
    try {
      await Linking.openURL(url);
      return true;
    } catch {
      return false;
    }
  },
}));

/** À appeler une fois au démarrage de l'app (RootNavigator). */
export function startUpdateWatcher(): () => void {
  // Un APK resté en cache (mise à jour déjà installée ou abandonnée) est supprimé.
  fireAndForget(cleanupApk());
  fireAndForget(
    cacheGetNumber(DISMISS_KEY).then(code => {
      if (code != null) useUpdateStore.setState({dismissedCode: code});
    }),
  );

  const offSession = onSessionEvent(event => {
    const s = useUpdateStore.getState();
    if (event.type === 'update') {
      if (event.level !== s.level) useUpdateStore.setState({level: event.level});
      if (event.level === 'none') return;
      if (event.level === 'required') forceUpgrade(s.latest);
      if (!s.latest && Date.now() - s.checkedAt > EVENT_CHECK_MIN_MS) {
        fireAndForget(s.check());
      }
    } else if (event.type === 'upgrade_required') {
      useUpdateStore.setState({
        level: 'required',
        latest: event.latest ?? s.latest,
      });
      if (!event.latest?.download_url && Date.now() - s.checkedAt > EVENT_CHECK_MIN_MS) {
        fireAndForget(s.check());
      }
    }
  });

  // Une seule vérification au démarrage (écran de connexion, premières secondes).
  // Ensuite, les en-têtes X-App-Update de chaque réponse du Worker font le travail.
  fireAndForget(useUpdateStore.getState().check());

  return offSession;
}
