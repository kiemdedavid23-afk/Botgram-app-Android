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
  /** .chat-item__title */
  titleSize: 15,
  titleWeight: '600' as const,
  /** .chat-item__time */
  timeSize: 12,
  /** .chat-item__preview */
  previewSize: 14,
  /** .chat-item__badge */
  badgeMinSize: 18,
  badgeFontSize: 11,
  badgeWeight: '700' as const,
  /** badge paddingHorizontal — ConversationsPage.css .chat-item__badge */
  badgePadH: 6,
  /** .search-bar--main */
  searchMarginT: 8,
  searchMarginH: 12,
  searchMarginB: 4,
  searchRadius: 12,
  searchPaddingV: 9,
  searchPaddingH: 12,
  /** .folders-row */
  foldersPaddingT: 4,
  foldersPaddingH: 12,
  foldersPaddingB: 10,
  /** .folders-track */
  foldersTrackRadius: 20,
  foldersTrackPad: 3,
  /** .folder-tab */
  folderTabPadV: 7,
  folderTabPadH: 14,
  folderTabRadius: 16,
  folderTabFont: 14,
  /** .folder-tab gap 6 — ConversationsPage.css .folder-tab gap: 6px */
  folderTabGap: 6,
  /** .folder-tab__count */
  folderCountSize: 12,
  folderCountMin: 18,
  /** .folder-tab__count padding 0 5px */
  folderCountPadH: 5,
  /** densité */
  densityTwoExtra: 0,
  densityThreeExtra: 4,
  offlinePad: 8,
  /** icône épingle — taille visuelle liste */
  pinIconSize: 14,
  /** gaps ligne titre / contenu */
  rowGap: 8,
  titleRowGap: 4,
  /** indicateur recherche position */
  searchingOffset: 16,
  footerSpinnerMargin: 12,
  previewFlex: 1,
  /** SearchBar icône et gap */
  searchIconSize: 18,
  searchRowGap: 8,
  searchHitSlop: 8,
} as const;
