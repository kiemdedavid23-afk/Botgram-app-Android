/** Couleurs de nom (réglage utilisateur) */
export const nameColors = [
  '#c44d8a',
  '#2AABEE',
  '#e67e22',
  '#27ae60',
  '#8e44ad',
] as const;

export type WallpaperId = 'home' | 'chick' | 'snow' | 'gem' | 'ocean';

export const wallpapers: Record<
  WallpaperId,
  {label: string; emoji: string; colors: [string, string]}
> = {
  home: {label: 'Maison', emoji: '🏠', colors: ['#b7e3b0', '#7ec8e3']},
  chick: {label: 'Poussin', emoji: '🐤', colors: ['#d4f0a8', '#f7e27a']},
  snow: {label: 'Neige', emoji: '⛄', colors: ['#c9e7ff', '#e8d7ff']},
  gem: {label: 'Gemme', emoji: '💎', colors: ['#d7c4ff', '#f7c1e3']},
  ocean: {label: 'Océan', emoji: '🐚', colors: ['#9ad7f5', '#7ee0d6']},
};

export type AppearanceSettings = {
  fontSize: number;
  cornerRadius: number;
  listDensity: 'two' | 'three';
  swipeAction: 'delete' | 'folder' | 'pin';
  wallpaper: WallpaperId;
  nameColor: string;
  followSystemTheme: boolean;
  limitAnimations: boolean;
  sendWithEnter: boolean;
  theme: ThemeMode;
};

export const defaultAppearance: AppearanceSettings = {
  fontSize: 16,
  cornerRadius: 17,
  listDensity: 'two',
  swipeAction: 'folder',
  wallpaper: 'home',
  nameColor: '#c44d8a',
  followSystemTheme: false,
  limitAnimations: false,
  sendWithEnter: false,
  theme: 'light',
};

export function getColors(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkColors : lightColors;
}

export function getShadow(
  name: keyof typeof shadows,
  mode: ThemeMode,
): ShadowStyle {
  return shadows[name][mode];
}
