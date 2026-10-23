/**
 * RootNavigator — bandeau session / bouton logout.
 * Sources : Auth.css body padding, Design tokens §3–5.
 */
export const rootNavigatorMetrics = {
  /** padding bandeau hors-ligne — proche sheet section padding */
  bannerPadding: 12,
  /** marginHorizontal logout = authMetrics.bodyPaddingH (Auth.css) */
  logoutMarginH: 22,
  /** paddingVertical logout ≈ fieldPaddingV Auth.css */
  logoutPadV: 14,
} as const;
