/**
 * Couleurs fixes des écrans d'authentification (toujours clair, comme le site).
 * Source : Auth.css. Aucune couleur en dur dans les écrans.
 */
export const authColors = {
  bg: '#ffffff',
  text: '#000000',
  textMuted: '#8e8e93',
  accent: '#2AABEE',
  border: '#e1e1e1',
  borderFocus: '#2AABEE',
  codeBorder: '#d0d0d0',
  danger: '#d93025',
  fabBg: '#2AABEE',
  fabShadow: 'rgba(42,171,238,0.4)',
  sheetOverlay: 'rgba(0,0,0,0.35)',
  sheetBg: '#ffffff',
  sheetButton: '#f2f2f2',
  logoShadow: 'rgba(10,127,176,0.35)',
  white: '#ffffff',
} as const;

export const authMetrics = {
  logoSize: 128,
  logoRadius: 28,
  logoMarginBottom: 22,
  titleSize: 28,
  titleWeight: '600' as const,
  subtitleSize: 16,
  subtitleMaxWidth: 280,
  subtitleLineHeight: 1.4,
  fabSize: 56,
  fabRight: 20,
  fabBottom: 24,
  headHeight: 56,
  fieldFontSize: 17,
  fieldPaddingV: 14,
  fieldPaddingH: 2,
  codeBoxWidth: 42,
  codeBoxHeight: 48,
  codeFontSize: 24,
  codeGap: 10,
  codeBorderWidth: 2,
  bodyPaddingH: 22,
  bodyPaddingTop: 8,
  helpSize: 15,
  sheetRadius: 16,
  sheetButtonRadius: 12,
  sheetButtonPadding: 12,
  /** ombre FAB — Auth.css .auth-fab box-shadow */
  fabShadowOpacity: 1,
  fabShadowRadius: 14,
  fabShadowOffsetX: 0,
  fabShadowOffsetY: 4,
  fabElevation: 6,
  /** disabled opacity — sans équivalent site (état disabled app) */
  fabDisabledOpacity: 0.5,
  /** icône flèche FAB — Auth.css */
  fabIconSize: 26,
} as const;


/**
 * Écran Welcome (1re page) — habillage sombre de l'affiche « Botsgram ».
 * Le reste du parcours de connexion reste clair (authColors).
 */
export const welcomeColors = {
  bg: '#020A2A',
  title: '#ffffff',
  accent: '#1E9BFF',
  subtitle: '#C3D2F0',
  buttonBg: '#1E9BFF',
  buttonText: '#ffffff',
  buttonShadow: 'rgba(30,155,255,0.55)',
} as const;

export const welcomeMetrics = {
  /** ratio hauteur/largeur de src/assets/welcome_hero.webp (1024 x 946) */
  heroRatio: 946 / 1024,
  /** le visuel occupe au moins 55 % de la hauteur d'écran, sans dépasser 125 % de sa hauteur naturelle (évite de rogner les bulles) */
  heroMinScreenShare: 0.55,
  heroMaxStretch: 1.25,
  logoSize: 84,
  logoMarginBottom: 14,
  brandSize: 40,
  headlineSize: 26,
  headlineLineHeight: 32,
  subtitleSize: 15,
  subtitleLineHeight: 21,
  subtitleMaxWidth: 300,
  contentPaddingTop: 28,
  contentPaddingH: 28,
  buttonHeight: 54,
  buttonRadius: 27,
  buttonFontSize: 17,
  footerPaddingH: 24,
  footerPaddingBottom: 24,
} as const;

/**
 * Écrans de saisie (email, …) sur fond photo sombre — voir AuthBackground.
 * Même bleu et même ambiance que l'écran Welcome.
 */
export const authDark = {
  title: '#ffffff',
  text: '#ffffff',
  help: '#C3D2F0',
  placeholder: 'rgba(195,210,240,0.55)',
  border: 'rgba(255,255,255,0.30)',
  borderFocus: '#1E9BFF',
  danger: '#FF8A8A',
  accent: '#1E9BFF',
  buttonText: '#ffffff',
  buttonShadow: 'rgba(30,155,255,0.45)',
  backIcon: '#ffffff',
} as const;

/**
 * Écrans clairs enrichis (Code, Profil) : surfaces douces et accents, sur le fond blanc d'origine.
 */
export const authUi = {
  accentStrong: '#0a7fb0',
  accentSoft: '#E8F5FD',
  accentBorder: '#BFE3F7',
  surface: '#F5F7FA',
  surfaceBorder: '#E3E8EE',
  label: '#3A4553',
  dangerSoft: '#FDECEA',
  dangerBorder: '#F5B7B1',
  warn: '#C2410C',
  warnSoft: '#FFF1E6',
  dotOff: '#D5DCE4',
  white: '#ffffff',
} as const;
