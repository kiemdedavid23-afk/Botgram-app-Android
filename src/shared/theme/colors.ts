/**
 * Design tokens — valeurs exactes de 02-DESIGN-TOKENS.md + DashboardPage.css.
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
  /** color-mix(accent 24%, transparent) — DashboardPage.css l.213 icon gradient */
  accentSoft24: string;
  border: string;
  /** color-mix(border 55%, transparent) — DashboardPage.css l.162, l.179 */
  borderSoft: string;
  bubbleOut: string;
  bubbleOutText: string;
  bubbleIn: string;
  bubbleInText: string;
  online: string;
  onlineSoft: string;
  divider: string;
  danger: string;
  dangerSoft: string;
  warn: string;
  success: string;
  successSoft: string;
  successText: string;
  navBg: string;
  linkTranslate: string;
  white: string;
  black: string;
  overlay: string;
  /** Hero text/chips — DashboardPage.css l.33, l.97, l.115-116 */
  heroText: string;
  heroTextMuted: string;
  heroChipBg: string;
  heroChipBorder: string;
  /** Ombre héros clair — DashboardPage.css l.35 */
  heroShadow: string;
  /** Ombre héros sombre — DashboardPage.css l.39 */
  heroShadowDark: string;
  /** Pastille statut good — MemberProfilePage.css .mp-chip__dot--good */
  statusGood: string;
  /** Pastille statut warn — .mp-chip__dot--warn */
  statusWarn: string;
  /** Pastille statut bad — .mp-chip__dot--bad */
  statusBad: string;
  /** Badge good soft — .mp-badge--good */
  badgeGoodBg: string;
  badgeGoodText: string;
  /** Badge warn soft — .mp-badge--warn */
  badgeWarnBg: string;
  badgeWarnText: string;
  /** Badge bad soft — .mp-badge--bad */
  badgeBadBg: string;
  /** Icon row good soft — .mp-row__icon--good */
  rowIconGoodBg: string;
  /** Icon row danger soft — .mp-row__icon--danger */
  rowIconDangerBg: string;
  /** Settings icon backgrounds — MemberSettingsPage inline */
  settingsIconProfile: string;
  settingsIconLogout: string;
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
  accentSoft24: 'rgba(51,144,236,0.24)', // DashboardPage.css l.213 color-mix accent 24%
  border: '#d9d9d9',
  borderSoft: 'rgba(217,217,217,0.55)', // color-mix border 55% — DashboardPage.css l.162
  bubbleOut: '#eeffde',
  bubbleOutText: '#000000',
  bubbleIn: '#ffffff',
  bubbleInText: '#000000',
  online: '#0ac630',
  onlineSoft: 'rgba(10,198,48,0.12)', // DashboardPage.css l.277
  divider: 'rgba(0,0,0,0.06)', // settings-common.css .chat-settings__header
  danger: '#e53935',
  dangerSoft: '#fff4f4', // AssociateFlow.css .assoc__error l.108
  warn: '#f59e0b', // DashboardPage.css quota arc ≥65%
  success: '#1b7f3a', // AssociateFlow.css .assoc__ok color
  successSoft: '#f0fff4', // AssociateFlow.css .assoc__ok background
  successText: '#1b7f3a', // AssociateFlow.css .assoc__ok
  navBg: 'rgba(255,255,255,0.92)',
  linkTranslate: '#2AABEE',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
  heroText: '#ffffff', // DashboardPage.css l.33
  heroTextMuted: 'rgba(255,255,255,0.9)', // DashboardPage.css l.97
  heroChipBg: 'rgba(255,255,255,0.18)', // DashboardPage.css l.115
  heroChipBorder: 'rgba(255,255,255,0.24)', // DashboardPage.css l.116
  heroShadow: '#2aabee', // DashboardPage.css l.35
  heroShadowDark: '#000000', // DashboardPage.css l.39
  statusGood: '#3ddc6b', // MemberProfilePage.css .mp-chip__dot--good
  statusWarn: '#ffc24d', // .mp-chip__dot--warn
  statusBad: '#ff6b6b', // .mp-chip__dot--bad
  badgeGoodBg: 'rgba(10,198,48,0.12)', // .mp-badge--good
  badgeGoodText: '#0ac630',
  badgeWarnBg: 'rgba(245,158,11,0.12)', // .mp-badge--warn
  badgeWarnText: '#f59e0b',
  badgeBadBg: 'rgba(229,57,53,0.12)', // .mp-badge--bad
  rowIconGoodBg: 'rgba(10,198,48,0.12)', // .mp-row__icon--good
  rowIconDangerBg: 'rgba(229,57,53,0.12)', // .mp-row__icon--danger
  settingsIconProfile: '#2AABEE', // MemberSettingsPage.tsx inline
  settingsIconLogout: '#e53935', // MemberSettingsPage.tsx inline
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
  accentSoft24: 'rgba(94,179,246,0.24)', // DashboardPage.css l.213 (dark)
  border: '#2b2b2b',
  borderSoft: 'rgba(43,43,43,0.55)', // color-mix border 55% — DashboardPage.css l.162
  bubbleOut: '#2b5278',
  bubbleOutText: '#ffffff',
  bubbleIn: '#182533',
  bubbleInText: '#ffffff',
  online: '#0ac630',
  onlineSoft: 'rgba(10,198,48,0.18)', // DashboardPage.css pastille Actif sombre
  divider: 'rgba(0,0,0,0.06)',
  danger: '#e53935',
  dangerSoft: 'rgba(229,57,53,0.08)', // sombre : le site n'a que #fff4f4 (AssociateFlow.css l.108) ; teinte danger 8 % pour garder le rendu d'avant
  warn: '#f59e0b',
  success: '#1b7f3a',
  successSoft: 'rgba(27,127,58,0.15)',
  successText: '#3dd68c',
  navBg: 'rgba(33,33,33,0.92)',
  linkTranslate: '#2AABEE',
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.45)',
  heroText: '#ffffff',
  heroTextMuted: 'rgba(255,255,255,0.9)',
  heroChipBg: 'rgba(255,255,255,0.18)',
  heroChipBorder: 'rgba(255,255,255,0.24)',
  heroShadow: '#2aabee',
  heroShadowDark: '#000000',
  statusGood: '#3ddc6b', // MemberProfilePage.css .mp-chip__dot--good
  statusWarn: '#ffc24d',
  statusBad: '#ff6b6b',
  badgeGoodBg: 'rgba(10,198,48,0.18)', // .mp-badge--good dark
  badgeGoodText: '#0ac630',
  badgeWarnBg: 'rgba(245,158,11,0.18)', // .mp-badge--warn dark
  badgeWarnText: '#f59e0b',
  badgeBadBg: 'rgba(229,57,53,0.18)',
  rowIconGoodBg: 'rgba(10,198,48,0.18)',
  rowIconDangerBg: 'rgba(229,57,53,0.18)',
  settingsIconProfile: '#2AABEE',
  settingsIconLogout: '#e53935',
};

export function getColors(mode: ThemeMode): ColorTokens {
  return mode === 'dark' ? darkColors : lightColors;
}