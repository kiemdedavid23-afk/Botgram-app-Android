import {
  lightColors,
  darkColors,
  defaultAppearance,
  getColors,
  radii,
  space,
  fontSize,
} from '../src/shared/theme';

describe('design tokens', () => {
  it('light colors match 02-DESIGN-TOKENS.md', () => {
    expect(lightColors.bgPrimary).toBe('#ffffff');
    expect(lightColors.bgSecondary).toBe('#f0f0f0');
    expect(lightColors.bgTertiary).toBe('#e4e4e4');
    expect(lightColors.bgChat).toBe('#c9d6e0');
    expect(lightColors.textPrimary).toBe('#000000');
    expect(lightColors.textSecondary).toBe('#707579');
    expect(lightColors.textHint).toBe('#999999');
    expect(lightColors.accent).toBe('#2AABEE');
    expect(lightColors.accentHover).toBe('#229ed9');
    expect(lightColors.accentSoft).toBe('rgba(51,144,236,0.12)');
    expect(lightColors.border).toBe('#d9d9d9');
    expect(lightColors.bubbleOut).toBe('#eeffde');
    expect(lightColors.bubbleIn).toBe('#ffffff');
    expect(lightColors.online).toBe('#0ac630');
    expect(lightColors.danger).toBe('#e53935');
    expect(lightColors.navBg).toBe('rgba(255,255,255,0.92)');
  });

  it('dark colors match 02-DESIGN-TOKENS.md', () => {
    expect(darkColors.bgPrimary).toBe('#212121');
    expect(darkColors.bgSecondary).toBe('#0f0f0f');
    expect(darkColors.bgTertiary).toBe('#2c2c2c');
    expect(darkColors.bgChat).toBe('#0e1621');
    expect(darkColors.textPrimary).toBe('#ffffff');
    expect(darkColors.textSecondary).toBe('#aaaaaa');
    expect(darkColors.textHint).toBe('#6c6c6c');
    expect(darkColors.accent).toBe('#5eb3f6');
    expect(darkColors.accentHover).toBe('#7bc1f7');
    expect(darkColors.accentSoft).toBe('rgba(94,179,246,0.15)');
    expect(darkColors.border).toBe('#2b2b2b');
    expect(darkColors.bubbleOut).toBe('#2b5278');
    expect(darkColors.bubbleIn).toBe('#182533');
    expect(darkColors.navBg).toBe('rgba(33,33,33,0.92)');
  });

  it('key dimensions match tokens', () => {
    expect(space.brandBarHeight).toBe(56);
    expect(space.bottomNavZone).toBe(72);
    expect(space.bottomNavPillHeight).toBe(58);
    expect(radii.navPill).toBe(28);
    expect(radii.navItemActive).toBe(22);
    expect(radii.messageBubble).toBe(14);
    expect(fontSize.brandTitle).toBe(22);
    expect(fontSize.navLabel).toBe(10);
    expect(defaultAppearance.fontSize).toBe(16);
    expect(defaultAppearance.cornerRadius).toBe(17);
  });

  it('getColors returns correct palette', () => {
    expect(getColors('light').accent).toBe(lightColors.accent);
    expect(getColors('dark').accent).toBe(darkColors.accent);
  });
});
