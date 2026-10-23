/**
 * EmptyScreen — écran vide centré.
 * Sans équivalent CSS site dédié : aligné Design tokens §5 (space.lg = 24).
 */
export const emptyScreenMetrics = {
  /** paddingHorizontal — space.lg 24 */
  padH: 24,
  /** marginTop sous-titre — space.sm 8 */
  subtitleMarginTop: 8,
  /** letter-spacing titre = -0.02 × pageHeader — Design tokens §4 */
  titleLetterSpacingFactor: 0.02,
} as const;
