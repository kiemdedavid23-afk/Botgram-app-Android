/**
 * En-têtes sous-page (SettingsShell, AuthHeader).
 * Source : settings-common.css .chat-settings__header ; Auth.css head.
 */
export const shellMetrics = {
  /** bouton retour / spacer 36 — settings-common.css header hit area */
  backBtnSize: 36,
  /** icône retour SettingsShell — settings-common.css */
  backIconSize: 22,
  /** icône retour AuthHeader — Auth.css (valeur app d'origine 24) */
  authBackIconSize: 24,
  /** hitSlop SettingsShell — sans équivalent site (accessibilité RN) */
  backHitSlop: 8,
  /** hitSlop AuthHeader — valeur app d'origine 12 */
  authBackHitSlop: 12,
  /** titre AuthHeader 20/600 — Auth.css head title */
  authTitleSize: 20,
  /** graisse titre — settings-common.css / Auth.css 600 */
  titleWeight: '600' as const,
  /** padding H AuthHeader — Auth.css head */
  authPadH: 4,
  /** marginRight titre pour symétrie bouton 36 — Auth.css */
  authTitleMarginRight: 36,
  /** border bottom header — settings-common.css */
  headerBorderWidth: 1,
} as const;
