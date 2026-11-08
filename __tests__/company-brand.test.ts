import {
  BASE_DARK,
  BASE_LIGHT,
  BOT_TINTS,
  BRAND_PRESETS,
  DEFAULT_BRAND_ID,
  brandById,
  contrastRatio,
  isBrandId,
} from '../src/features/accounts/company/companyPalette';
import {parseBrandCache, useBrandStore} from '../src/features/accounts/store/brandStore';
import * as storage from '../src/core/storage';

jest.mock('../src/core/storage');

const mockCacheGet = storage.cacheGetString as jest.Mock;
const mockCacheSet = storage.cacheSetString as jest.Mock;
const mockCacheDelete = storage.cacheDelete as jest.Mock;

const AA = 4.5;

describe('contrastes de la palette entreprise', () => {
  it('le texte secondaire reste lisible sur tous les fonds (clair et sombre)', () => {
    for (const bg of [BASE_LIGHT.bg, BASE_LIGHT.bgGlow, BASE_LIGHT.card, BASE_LIGHT.soft]) {
      expect(contrastRatio(BASE_LIGHT.inkSoft, bg)).toBeGreaterThanOrEqual(AA);
    }
    for (const bg of [BASE_DARK.bg, BASE_DARK.bgGlow, BASE_DARK.card, BASE_DARK.tile]) {
      expect(contrastRatio(BASE_DARK.inkSoft, bg)).toBeGreaterThanOrEqual(AA);
    }
  });
  it('le rouge « Supprimer le compte » est lisible sur la carte', () => {
    expect(contrastRatio(BASE_LIGHT.bad, BASE_LIGHT.card)).toBeGreaterThanOrEqual(AA);
    expect(contrastRatio(BASE_DARK.bad, BASE_DARK.card)).toBeGreaterThanOrEqual(AA);
  });
  it('chaque couleur de marque garde le blanc lisible sur ses grandes cartes', () => {
    for (const p of BRAND_PRESETS) {
      expect(contrastRatio(BASE_LIGHT.onHero, p.heroHi)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(BASE_LIGHT.onHero, p.heroLo)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(BASE_LIGHT.onPrimary, p.accentLight)).toBeGreaterThanOrEqual(AA);
    }
  });
  it('en mode sombre, l’accent est lisible sur la carte et porte un texte sombre', () => {
    for (const p of BRAND_PRESETS) {
      expect(contrastRatio(p.accentDark, BASE_DARK.card)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(BASE_DARK.onPrimary, p.accentDark)).toBeGreaterThanOrEqual(AA);
    }
  });
  it('la lettre blanche des pastilles de bot est lisible', () => {
    for (const tint of BOT_TINTS) {
      expect(contrastRatio('#FFFFFF', tint)).toBeGreaterThanOrEqual(AA);
    }
  });
  it('l’ombre des cartes reste visible en sombre', () => {
    expect(BASE_DARK.shadowOpacity).toBeGreaterThan(BASE_LIGHT.shadowOpacity);
  });
});

describe('préréglages de marque', () => {
  it('identifiants uniques, défaut présent', () => {
    const ids = BRAND_PRESETS.map(p => p.id);
    expect(new Set(ids).size).toBe(ids.length);
    expect(isBrandId(DEFAULT_BRAND_ID)).toBe(true);
  });
  it('brandById retombe sur le défaut', () => {
    expect(brandById('teal').id).toBe('teal');
    expect(brandById('inconnu').id).toBe(DEFAULT_BRAND_ID);
    expect(brandById(null).id).toBe(DEFAULT_BRAND_ID);
    expect(isBrandId('inconnu')).toBe(false);
  });
});

describe('brandStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCacheGet.mockResolvedValue(undefined);
    mockCacheSet.mockResolvedValue(undefined);
    mockCacheDelete.mockResolvedValue(undefined);
    useBrandStore.getState().clear();
    jest.clearAllMocks();
  });

  it('parseBrandCache ignore le contenu invalide', () => {
    expect(parseBrandCache(undefined)).toEqual({});
    expect(parseBrandCache('pas du json')).toEqual({});
    expect(parseBrandCache('[]')).toEqual({});
    expect(parseBrandCache('{"c_1":"teal","c_2":"nope","c_3":3}')).toEqual({c_1: 'teal'});
  });

  it('hydrate lit le cache', async () => {
    mockCacheGet.mockResolvedValue('{"c_1":"rose"}');
    await useBrandStore.getState().hydrate();
    expect(useBrandStore.getState().byWorkspace).toEqual({c_1: 'rose'});
    expect(useBrandStore.getState().hydrated).toBe(true);
  });

  it('setBrand met à jour l’état et écrit le cache', () => {
    useBrandStore.getState().setBrand('c_1', 'violet');
    expect(useBrandStore.getState().byWorkspace.c_1).toBe('violet');
    expect(mockCacheSet).toHaveBeenCalledWith('company.brand', '{"c_1":"violet"}');
  });

  it('un choix fait avant la fin de la lecture l’emporte sur le cache', async () => {
    mockCacheGet.mockResolvedValue('{"c_1":"rose","c_2":"teal"}');
    const pending = useBrandStore.getState().hydrate();
    useBrandStore.getState().setBrand('c_1', 'orange');
    await pending;
    expect(useBrandStore.getState().byWorkspace).toEqual({c_1: 'orange', c_2: 'teal'});
  });

  it('clear remet à zéro et supprime le cache', () => {
    useBrandStore.getState().setBrand('c_1', 'teal');
    useBrandStore.getState().clear();
    expect(useBrandStore.getState().byWorkspace).toEqual({});
    expect(mockCacheDelete).toHaveBeenCalledWith('company.brand');
  });
});
