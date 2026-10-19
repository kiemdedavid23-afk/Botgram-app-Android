/** Rayons (px) */
export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  full: 9999,
  messageBubble: 14,
  messageBubbleSenderCorner: 4,
  bottomSheet: 20,
  navPill: 28,
  navItemActive: 22,
  botIcon: 14,
  searchBar: 12,
  fileIcon: 10,
  photo: 10,
  /** Réglage utilisateur --msg-radius, défaut 17 */
  msgDefault: 17,
} as const;

/** Espacements et dimensions clés */
export const space = {
  brandBarHeight: 56,
  brandBarPaddingLeft: 14,
  brandBarPaddingRight: 12,
  bottomNavZone: 72,
  bottomNavPillHeight: 58,
  bottomNavPillMaxWidth: 420,
  bottomNavPillPaddingH: 6,
  bottomNavMarginH: 12,
  bottomNavMarginBottom: 10,
  bottomNavItemHeight: 48,
  navAvatarSize: 24,
  conversationAvatarSize: 40,
  iconButtonPadding: 8,
  moreButtonSize: 36,
  badgeMin: 16,
  badgeRadius: 8,
  onlineDot: 13,
  onlineDotBorder: 2,
  sheetHandleWidth: 36,
  sheetHandleHeight: 4,
  sheetMaxWidth: 480,
  messageMaxWidthPercent: 0.78,
  mediaBubbleMaxWidth: 260,
  searchBarRadius: 12,
} as const;

/** Typographie (tailles en px) — pile système (Roboto sur Android) */
export const fontSize = {
  brandTitle: 22,
  pageHeader: 20,
  conversationTitle: 16,
  conversationStatus: 13,
  message: 15,
  /** Réglage utilisateur --msg-font-size, défaut 16 */
  msgDefault: 16,
  messageTime: 11,
  messageStatus: 12,
  listName: 15,
  listSubtitle: 13,
  sheetSectionLabel: 11,
  menuItem: 15,
  closeButton: 15,
  navLabel: 10,
  badge: 10,
  searchField: 15,
  fileName: 14,
  fileSize: 12,
  voiceDuration: 11,
  navAvatarInitial: 11,
  conversationAvatarInitial: 16,
} as const;

export const fontWeight = {
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
};
