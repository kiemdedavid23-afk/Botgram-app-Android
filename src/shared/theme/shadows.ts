/**
 * Correspondance ombres CSS → props Android (elevation + shadow*).
 * Documentée dans LIVRAISONS.md.
 */
export type ShadowStyle = {
  elevation: number;
  shadowColor: string;
  shadowOpacity: number;
  shadowRadius: number;
  shadowOffset: {width: number; height: number};
};

export const shadows = {
  sm: {
    light: {
      elevation: 1,
      shadowColor: '#000000',
      shadowOpacity: 0.06,
      shadowRadius: 2,
      shadowOffset: {width: 0, height: 1},
    },
    dark: {
      elevation: 2,
      shadowColor: '#000000',
      shadowOpacity: 0.35,
      shadowRadius: 3,
      shadowOffset: {width: 0, height: 1},
    },
  },
  md: {
    light: {
      elevation: 3,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      shadowOffset: {width: 0, height: 2},
    },
    dark: {
      elevation: 6,
      shadowColor: '#000000',
      shadowOpacity: 0.45,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 4},
    },
  },
  /** Pilule nav : ombre + liseré 1 px géré séparément en border */
  navPill: {
    light: {
      elevation: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.1,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 2},
    },
    dark: {
      elevation: 4,
      shadowColor: '#000000',
      shadowOpacity: 0.4,
      shadowRadius: 16,
      shadowOffset: {width: 0, height: 2},
    },
  },
  menu: {
    light: {
      elevation: 8,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 30,
      shadowOffset: {width: 0, height: 10},
    },
    dark: {
      elevation: 8,
      shadowColor: '#000000',
      shadowOpacity: 0.18,
      shadowRadius: 30,
      shadowOffset: {width: 0, height: 10},
    },
  },
} as const;

export function getShadow(
  name: keyof typeof shadows,
  mode: 'light' | 'dark',
): ShadowStyle {
  return shadows[name][mode];
}

/** Liseré de la pilule (border 1 px) */
export const navPillBorder = {
  light: 'rgba(0,0,0,0.04)',
  dark: 'rgba(255,255,255,0.06)',
} as const;

/** Durées d'animation (ms) et courbes (nommées pour Animated) */
export const animation = {
  overlayIn: 180,
  sheetIn: 220,
  menuPop: 160,
  messageIn: 200,
  typingBounce: 1200,
  wavePulse: 600,
  bpRise: 250,
  fadeIn: 180,
  slideUp: 250,
  menuIn: 150,
  toastIn: 250,
  rotate: 900,
  pulse: 1900,
  floatA: 7000,
  floatB: 9000,
  breathe: 2800,
  wave: 2400,
  shimmer: 1400,
  themeTransition: 250,
  press: 120,
  chevron: 200,
} as const;
