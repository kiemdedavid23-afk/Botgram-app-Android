import {
  resolveChatTheme,
  wallpaperBubbleOut,
  wallpapers,
  lightColors,
  darkColors,
  type WallpaperId,
} from '../src/shared/theme';

describe('resolveChatTheme', () => {
  const ids = Object.keys(wallpapers) as WallpaperId[];

  it('has an outgoing bubble color for every wallpaper', () => {
    ids.forEach(id => {
      expect(wallpaperBubbleOut[id]).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });

  it('light: wallpaper colors, themed outgoing bubble, white text, no dim', () => {
    const c = resolveChatTheme('home', 'light', lightColors);
    expect(c.wallpaperColors).toEqual(wallpapers.home.colors);
    expect(c.bubbleOut).toBe(wallpaperBubbleOut.home);
    expect(c.bubbleOutText).toBe('#ffffff');
    expect(c.bubbleIn).toBe(lightColors.bubbleIn);
    expect(c.dim).toBe(false);
  });

  it('dark: dimmed wallpaper and dark palette bubbles', () => {
    const c = resolveChatTheme('ocean', 'dark', darkColors);
    expect(c.dim).toBe(true);
    expect(c.bubbleOut).toBe(darkColors.bubbleOut);
    expect(c.bubbleIn).toBe(darkColors.bubbleIn);
  });
});
