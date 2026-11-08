import {BRAND_PRESETS, companyTokensFor, contrastRatio} from '../src/features/accounts/company/companyPalette';
import {flowColorsFrom} from '../src/features/accounts/company/flowPalette';
import {darkColors, lightColors} from '../src/shared/theme/colors';

const AA = 4.5;

describe.each([
  ['clair', false, lightColors],
  ['sombre', true, darkColors],
] as const)('couleurs du parcours association et du profil bot (%s)', (_label, dark, base) => {
  for (const preset of BRAND_PRESETS) {
    it(`${preset.id} : textes lisibles sur les surfaces`, () => {
      const c = flowColorsFrom(base, companyTokensFor(dark, preset.id), dark);
      for (const bg of [c.bgPrimary, c.bgSecondary]) {
        expect(contrastRatio(c.textPrimary, bg)).toBeGreaterThanOrEqual(AA);
        expect(contrastRatio(c.textSecondary, bg)).toBeGreaterThanOrEqual(AA);
        expect(contrastRatio(c.accent, bg)).toBeGreaterThanOrEqual(AA);
      }
      expect(contrastRatio(c.danger, c.bgPrimary)).toBeGreaterThanOrEqual(AA);
      expect(contrastRatio(c.successText, c.successSoft)).toBeGreaterThanOrEqual(AA);
    });

    it(`${preset.id} : le texte posé sur l’accent est lisible`, () => {
      const c = flowColorsFrom(base, companyTokensFor(dark, preset.id), dark);
      expect(contrastRatio(c.onAccent, c.accent)).toBeGreaterThanOrEqual(AA);
    });
  }

  it('garde toutes les clés Botgram et ne change que les valeurs', () => {
    const c = flowColorsFrom(base, companyTokensFor(dark, 'indigo'), dark);
    for (const key of Object.keys(base)) {
      expect(c).toHaveProperty(key);
    }
    expect(c.bgPrimary).not.toBe(base.bgPrimary);
    expect(c.white).toBe(base.white);
  });

  it('suit la couleur de marque choisie', () => {
    const a = flowColorsFrom(base, companyTokensFor(dark, 'indigo'), dark);
    const b = flowColorsFrom(base, companyTokensFor(dark, 'rose'), dark);
    expect(a.accent).not.toBe(b.accent);
  });

  it('couleur inconnue : retombe sur la couleur par défaut', () => {
    const a = flowColorsFrom(base, companyTokensFor(dark, 'inconnue'), dark);
    const d = flowColorsFrom(base, companyTokensFor(dark, 'indigo'), dark);
    expect(a.accent).toBe(d.accent);
  });
});
