/**
 * Métriques des barres de navigation basses (BottomNav, BotBottomNav).
 * Source : BottomNav.css + 02-DESIGN-TOKENS.md §4-5.
 */
export const navMetrics = {
  /** left / right / bottom de la zone — BottomNav.css .bottom-nav (0) */
  edge: 0,
  /** pile d'affichage — BottomNav.css z-index 100 */
  zIndex: 100,
  /** liseré de la pilule — BottomNav.css box-shadow 0 0 0 1px */
  borderWidth: 1,
  /** gap icône/libellé — BottomNav.css .bottom-nav__item gap 2px */
  itemGap: 2,
  /** opacité à l'appui — BottomNav.css .bottom-nav__item:active 0.7 */
  itemPressedOpacity: 0.7,
  /** interlettre du libellé = 0.01em — BottomNav.css .bottom-nav__label */
  labelLetterSpacingFactor: 0.01,
  /** badge top -6 — BottomNav.css .bottom-nav__badge */
  badgeOffsetTop: -6,
  /** badge right -10 — BottomNav.css .bottom-nav__badge */
  badgeOffsetRight: -10,
  /** padding horizontal du badge 0 4 — BottomNav.css .bottom-nav__badge */
  badgePadH: 4,
  /** diamètre externe de l'anneau d'avatar (24 + 2×2) — BottomNav.css avatar actif */
  avatarOuterSize: 28,
  /** marge négative qui compense l'anneau — évite de grossir l'item */
  avatarOuterMargin: -2,
  /** épaisseur de l'anneau actif 2px — BottomNav.css .bottom-nav__item--active .bottom-nav__avatar */
  avatarRingBorder: 2,
  /** anneau inactif invisible */
  transparent: 'transparent' as const,
} as const;