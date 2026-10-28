/**
 * Thème du fil de discussion dérivé du réglage Apparence (fond d'écran).
 * Chaque fond impose aussi la couleur des bulles sortantes (comme un thème Telegram).
 */
import type {ColorTokens, ThemeMode} from './colors';
import {wallpapers, type WallpaperId} from './appearance';

/** Couleur des bulles sortantes par fond (texte blanc dessus). */
export const wallpaperBubbleOut: Record<WallpaperId, string> = {
  home: '#3390EC',
  chick: '#5AA83A',
  snow: '#7B6CF0',
  gem: '#C04FD0',
  ocean: '#1FA89A',
};

export type ChatTheme = {
  wallpaperColors: [string, string];
  /** Voile noir par-dessus le fond en thème sombre. */
  dim: boolean;
  bubbleIn: string;
  bubbleInText: string;
  bubbleOut: string;
  bubbleOutText: string;
  timeIn: string;
  timeOut: string;
};

export function resolveChatTheme(
  wallpaper: WallpaperId,
  mode: ThemeMode,
  colors: ColorTokens,
): ChatTheme {
  const wp = wallpapers[wallpaper] ?? wallpapers.home;
  if (mode === 'dark') {
    return {
      wallpaperColors: wp.colors,
      dim: true,
      bubbleIn: colors.bubbleIn,
      bubbleInText: colors.bubbleInText,
      bubbleOut: colors.bubbleOut,
      bubbleOutText: colors.bubbleOutText,
      timeIn: colors.textHint,
      timeOut: 'rgba(255,255,255,0.65)',
    };
  }
  return {
    wallpaperColors: wp.colors,
    dim: false,
    bubbleIn: colors.bubbleIn,
    bubbleInText: colors.bubbleInText,
    bubbleOut: wallpaperBubbleOut[wallpaper] ?? wallpaperBubbleOut.home,
    bubbleOutText: '#ffffff',
    timeIn: colors.textHint,
    timeOut: 'rgba(255,255,255,0.75)',
  };
}
