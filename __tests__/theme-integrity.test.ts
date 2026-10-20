/**
 * Vérifie que les tokens de thème sont complets et cohérents.
 */
import {
  lightColors,
  darkColors,
  shadows,
  getShadow,
  getColors,
} from '../src/shared/theme';

describe('theme tokens integrity', () => {
  it('lightColors has expected keys and values', () => {
    expect(lightColors.bgPrimary).toBe('#ffffff');
    expect(lightColors.accent).toBe('#2AABEE');
    expect(lightColors.navBg).toBe('rgba(255,255,255,0.92)');
  });

  it('darkColors has expected keys and values', () => {
    expect(darkColors.bgPrimary).toBe('#212121');
    expect(darkColors.accent).toBe('#5eb3f6');
    expect(darkColors.navBg).toBe('rgba(33,33,33,0.92)');
  });

  it('shadows has sm/md/navPill/menu with light and dark', () => {
    expect(shadows.sm.light.elevation).toBe(1);
    expect(shadows.md.dark.elevation).toBe(6);
    expect(shadows.navPill.light.shadowOpacity).toBe(0.1);
    expect(shadows.menu.dark.elevation).toBe(8);
  });

  it('getColors and getShadow return correct values', () => {
    expect(getColors('light').bgPrimary).toBe(lightColors.bgPrimary);
    expect(getColors('dark').accent).toBe(darkColors.accent);
    expect(getShadow('sm', 'light').elevation).toBe(1);
    expect(getShadow('navPill', 'dark').shadowOpacity).toBe(0.4);
  });
});
