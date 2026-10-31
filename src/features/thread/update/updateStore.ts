/**
 * Mises à jour : niveau (none / optional / required), dernière version connue, « Plus tard ».
 * Sources : en-tête X-App-Update (chaque réponse), 426, et GET /app/updates (vérification active).
 */
import {Linking} from 'react-native';
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
import {useAuthStore} from '../auth/store/authStore';

const DISMISS_KEY = 'update.dismissedCode';
const EVENT_CHECK_MIN_MS = 60_000;

export type CheckResult = 'idle' | 'uptodate' | 'available' | 'failed';

type UpdateStore = {
  level: UpdateLevel;
  latest: LatestBuild | null;
  checking: boolean;
  checkedAt: number;
  result: CheckResult;
  /** version_code pour lequel « Plus tard » a été choisi (-1 si inconnu). */
  dismissedCode: number | null;
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
