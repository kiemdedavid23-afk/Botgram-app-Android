/**
 * Dégradés déclarés (02-DESIGN-TOKENS.md §6).
 * Utilisés via react-native LinearGradient si besoin, ou approximation.
 * Pour l'étape 1, exposés comme tuples de couleurs + angle.
 */

export type GradientDef = {
  colors: string[];
  locations?: number[];
  /** Angle en degrés (convention CSS) */
  angle: number;
};

export const gradients = {
  avatar: {
    colors: ['#3390ec', '#5c6bc0'],
    angle: 145,
  } satisfies GradientDef,

  brandHero: {
    colors: ['#2aabee', '#1b7fd6', '#2a5bd7'],
    locations: [0, 0.55, 1],
    angle: 135,
  } satisfies GradientDef,

  brandHeroAlt: {
    colors: ['#2a7fc0', '#1f5f9e', '#2a4aa0'],
    locations: [0, 0.55, 1],
    angle: 135,
  } satisfies GradientDef,

  imageBottomShadow: {
    colors: ['transparent', 'rgba(0,0,0,0.55)'],
    angle: 180,
  } satisfies GradientDef,

  instagram: {
    colors: ['#f09433', '#e6683c', '#dc2743', '#cc2366', '#bc1888'],
    locations: [0, 0.25, 0.5, 0.75, 1],
    angle: 135,
  } satisfies GradientDef,
} as const;

/** Dégradés de fond d'écran conversation (angle 160°) */
export const wallpaperGradients = {
  home: {colors: ['#b7e3b0', '#7ec8e3'], angle: 160},
  chick: {colors: ['#d4f0a8', '#f7e27a'], angle: 160},
  snow: {colors: ['#c9e7ff', '#e8d7ff'], angle: 160},
  gem: {colors: ['#d7c4ff', '#f7c1e3'], angle: 160},
  ocean: {colors: ['#9ad7f5', '#7ee0d6'], angle: 160},
} as const;
