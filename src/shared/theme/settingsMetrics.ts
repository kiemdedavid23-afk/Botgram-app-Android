/**
 * Dimensions onglet Paramètres membre.
 * Source : settings-list.css (.settings-card, .settings-row).
 */
export const settingsMetrics = {
  /** .settings-card margin 0 12 20, radius 18 — settings-list.css l.231-236 */
  cardMarginH: 12,
  cardMarginTop: 12,
  scrollPadBottom: 32,
  cardMarginBottom: 20,
  cardRadius: 18,
  /** .settings-row padding 12 14, gap 14 — l.238-248 */
  rowPadV: 12,
  rowPadH: 14,
  rowGap: 14,
  /** .settings-row__icon 36? site style inline  background colors ; size ~36 */
  iconSize: 36,
  iconRadius: 10,
  iconInner: 18,
  titleSize: 16,
  titleWeight: '600' as const,
  subSize: 13,
} as const;
