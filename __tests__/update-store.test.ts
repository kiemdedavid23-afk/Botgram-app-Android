import {Linking} from 'react-native';
import {useUpdateStore} from '../src/features/update/updateStore';
import {useAuthStore} from '../src/features/auth/store/authStore';
import {fetchUpdateCheck} from '../src/core/api/endpoints/appUpdates';
import * as installer from '../src/features/update/installer';

jest.mock('../src/core/api/endpoints/appUpdates', () => ({
  fetchUpdateCheck: jest.fn(),
}));
jest.mock('../src/features/update/installer');
jest.mock('../src/core/storage', () => ({
  cacheGetNumber: jest.fn(async () => null),
  cacheSetNumber: jest.fn(async () => undefined),
}));

const fetchCheck = fetchUpdateCheck as jest.Mock;
const ins = installer as jest.Mocked<typeof installer>;

const LATEST = {
  version_code: 5,
  version_name: '1.5.0',
  download_url: 'https://x.invalid/b.apk',
  sha256: 'abc',
  size_bytes: 100,
};

const ok = (data: unknown) => ({ok: true, status: 200, data});

function reset(): void {
  useUpdateStore.setState({
    level: 'none',
    latest: null,
    checking: false,
    checkedAt: 0,
    result: 'idle',
    dismissedCode: null,
    installPhase: 'idle',
    progress: 0,
    installError: null,
  });
  useAuthStore.setState({state: 'signedIn', upgradeLatest: null});
}

beforeEach(() => {
  jest.clearAllMocks();
  reset();
  ins.isInstallerAvailable.mockReturnValue(true);
  ins.canInstallApks.mockResolvedValue(true);
  ins.downloadApk.mockResolvedValue(undefined);
  ins.installApk.mockResolvedValue(undefined);
});

describe('check', () => {
  it('à jour : level none, résultat uptodate', async () => {
    fetchCheck.mockResolvedValue(ok({update: 'none'}));
    await useUpdateStore.getState().check(true);
    const s = useUpdateStore.getState();
    expect(s.level).toBe('none');
    expect(s.result).toBe('uptodate');
  });

  it('optionnelle : latest renseignée, pas de blocage', async () => {
    fetchCheck.mockResolvedValue(ok({update: 'optional', latest: LATEST}));
    await useUpdateStore.getState().check();
    const s = useUpdateStore.getState();
    expect(s.level).toBe('optional');
    expect(s.latest?.version_name).toBe('1.5.0');
    expect(useAuthStore.getState().state).toBe('signedIn');
  });

  it('obligatoire : bascule sur l’écran de mise à jour requise', async () => {
    fetchCheck.mockResolvedValue(ok({update: 'required', latest: LATEST}));
    await useUpdateStore.getState().check();
    expect(useAuthStore.getState().state).toBe('upgradeRequired');
    expect(useAuthStore.getState().upgradeLatest).toBe('1.5.0');
  });

  it('échec réseau : manuel signale failed, automatique reste discret', async () => {
    fetchCheck.mockResolvedValue({ok: false, status: 0});
    await useUpdateStore.getState().check();
    expect(useUpdateStore.getState().result).toBe('idle');
    await useUpdateStore.getState().check(true);
    expect(useUpdateStore.getState().result).toBe('failed');
  });
});

describe('dismiss', () => {
  it('mémorise la version écartée', () => {
    useUpdateStore.setState({latest: LATEST});
    useUpdateStore.getState().dismiss();
    expect(useUpdateStore.getState().dismissedCode).toBe(5);
  });
});

describe('startUpdate', () => {
  beforeEach(() => {
    useUpdateStore.setState({level: 'optional', latest: LATEST});
  });

  it('canal direct autorisé : télécharge puis installe', async () => {
    await useUpdateStore.getState().startUpdate();
    expect(ins.downloadApk).toHaveBeenCalledWith(
      LATEST.download_url,
      'abc',
      100,
      expect.any(Function),
    );
    expect(ins.installApk).toHaveBeenCalled();
    expect(useUpdateStore.getState().installPhase).toBe('idle');
  });

  it('sans empreinte SHA-256 : ouvre le lien, aucun téléchargement natif', async () => {
    const spy = jest.spyOn(Linking, 'openURL').mockResolvedValue(undefined);
    useUpdateStore.setState({latest: {...LATEST, sha256: undefined}});
    await useUpdateStore.getState().startUpdate();
    expect(spy).toHaveBeenCalledWith(LATEST.download_url);
    expect(ins.downloadApk).not.toHaveBeenCalled();
  });

  it('autorisation d’installation absente : ouvre les réglages', async () => {
    ins.canInstallApks.mockResolvedValue(false);
    ins.openInstallSettings.mockResolvedValue(undefined);
    await useUpdateStore.getState().startUpdate();
    expect(useUpdateStore.getState().installPhase).toBe('needsPermission');
    expect(ins.openInstallSettings).toHaveBeenCalled();
    expect(ins.downloadApk).not.toHaveBeenCalled();
  });

  it('fichier invalide : erreur explicite, jamais d’installation', async () => {
    ins.downloadApk.mockRejectedValue(
      Object.assign(new Error('x'), {code: 'hash_mismatch'}),
    );
    await useUpdateStore.getState().startUpdate();
    const s = useUpdateStore.getState();
    expect(s.installPhase).toBe('error');
    expect(s.installError).toBeTruthy();
    expect(ins.installApk).not.toHaveBeenCalled();
  });

  it('annulation : retour à idle sans message d’erreur', async () => {
    ins.downloadApk.mockRejectedValue(
      Object.assign(new Error('x'), {code: 'cancelled'}),
    );
    await useUpdateStore.getState().startUpdate();
    const s = useUpdateStore.getState();
    expect(s.installPhase).toBe('idle');
    expect(s.installError).toBeNull();
  });
});
