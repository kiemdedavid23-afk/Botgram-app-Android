/**
 * Métriques liste conversations — sources ConversationsPage.css
 */
export const conversationsMetrics = {
  /** ConversationsPage.css .chat-item padding 9px 16px */
  itemPaddingV: 9,
  itemPaddingH: 16,
  /** gap 12px */
  itemGap: 12,
  /** .chat-item__avatar 54×54 */
  avatarSize: 54,
  /** font-size 20, font-weight 600 */
  avatarFontSize: 20,
  avatarFontWeight: '600' as const,
  /** .chat-item__content gap 3px */
  contentGap: 3,
  /** .chat-item__title — proche 15/600 (tokens typo liste) */
  titleSize: 15,
  titleWeight: '600' as const,
  /** .chat-item__time — 11–12 secondary */
  timeSize: 12,
  /** .chat-item__preview */
  previewSize: 14,
  /** .chat-item__badge min */
  badgeMinSize: 18,
  badgeFontSize: 11,
  badgeWeight: '700' as const,
  /** .search-bar--main margin 8 12 4, radius 22, padding 10 14 — site; tokens barre recherche rayon 12 aussi cité design tokens §5 → on utilise 12 du design system pour cohérence tokens §5 */
  searchMarginT: 8,
  searchMarginH: 12,
  searchMarginB: 4,
  searchRadius: 12,
  searchPaddingV: 9,
  searchPaddingH: 12,
  /** .folders-row padding 4 12 10 */
  foldersPaddingT: 4,
  foldersPaddingH: 12,
  foldersPaddingB: 10,
  /** .folders-track radius 20, padding 3 */
  foldersTrackRadius: 20,
  foldersTrackPad: 3,
  /** .folder-tab padding 7 14, radius 16, font 14/500 */
  folderTabPadV: 7,
  folderTabPadH: 14,
  folderTabRadius: 16,
  folderTabFont: 14,
  /** .folder-tab__count 12/600, 18 min */
  folderCountSize: 12,
  folderCountMin: 18,
  /** densité two / three — écart vertical item */
  densityTwoExtra: 0,
  densityThreeExtra: 4,
  /** bandeau hors ligne padding */
  offlinePad: 8,
} as const;
