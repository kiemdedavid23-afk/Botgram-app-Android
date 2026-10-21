/**
 * Design tokens — valeurs exactes de 02-DESIGN-TOKENS.md.
 * Aucune couleur/taille en dur hors de ce module et gradients.ts.
 */

export type ThemeMode = 'light' | 'dark';

export type ColorTokens = {
  bgPrimary: string;
  bgSecondary: string;
  bgTertiary: string;
  bgChat: string;
  textPrimary: string;
  textSecondary: string;
  textHint: string;
  accent: string;
  accentHover: string;
  accentSoft: string;
  border: string;
  bubbleOut: string;
  bubbleOutText: string;
  bubbleIn: string;
  bubbleInText: string;
  online: string;
  danger: string;
  warn: string;
  navBg: string;
  linkTranslate: string;
  white: string;
  black: string;
  overlay: string;
};

export const lightColors: ColorTokens = {
  bgPrimary: '#ffffff',
  bgSecondary: '#f0f0f0',
  bgTertiary: '#e4e4e4',
  bgChat: '#c9d6e0',
  textPrimary: '#000000',
  textSecondary: '#707579',
  textHint: '#999999',
  accent: '#2AABEE',
  accentHover: '#229ed9',
  accentSoft: 'rgba(51,144,236,0.12)',
  border: '#d9d9d9',
  bubbleOut: '#eeffde',
  bubbleOutText: '#000000',
  bubbleIn: '#ffffff',
  bubbleInText: '#000000',
  online: '#0ac630',
  danger: '#e53935',
  warn: '#f59e0b', // DashboardPage.css quota arc ≥65%
  navBg: 'rgba(255,255,255,0.92)',
  linkTranslate: '#2AABEE',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
};

export const darkColors: ColorTokens = {
  bgPrimary: '#212121',
  bgSecondary: '#0f0f0f',
  bgTertiary: '#2c2c2c',
  bgChat: '#0e1621',
  textPrimary: '#ffffff',
  textSecondary: '#aaaaaa',
  textHint: '#6c6c6c',
  accent: '#5eb3f6',
  accentHover: '#7bc1f7',
  accentSoft: 'rgba(94,179,246,0.15)',
  border: '#2b2b2b',
  bubbleOut: '#2b5278',
  bubbleOutText: '#ffffff',
  bubbleIn: '#182533',
  bubbleInText: '#ffffff',
  online: '#0ac630',
  danger: '#e53935',
  warn: '#f59e0b', // DashboardPage.css quota arc ≥65%
  navBg: 'rgba(33,33,33,0.92)',
  linkTranslate: '#2AABEE',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
};

export function getColors(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkColors : lightColors;
}
