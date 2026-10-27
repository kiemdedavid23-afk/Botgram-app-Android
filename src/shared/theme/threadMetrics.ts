/**
 * Métriques fil de messages — sources ConversationPage.css / MessageBubble.css
 */
export const threadMetrics = {
  /** .messages-area padding 12px 10px 16px */
  listPadT: 12,
  listPadH: 10,
  listPadB: 16,
  /** gap 3px */
  listGap: 3,
  /** .message max-width 78% */
  bubbleMaxWidthPct: 0.78,
  /** .message__bubble padding 7px 11px 5px */
  bubblePadT: 7,
  bubblePadH: 11,
  bubblePadB: 5,
  /** border-radius 14px */
  bubbleRadius: 14,
  /** .message__time */
  timeSize: 11,
  /** .message__time margin-top */
  timeMarginT: 2,
  /** .conversation-header */
  headerHeight: 56,
  headerGap: 6,
  headerPadL: 2,
  headerPadR: 6,
  headerInfoGap: 10,
  headerHitSlop: 8,
  avatarSize: 40,
  titleSize: 16,
  /** En-tête flottant (pilule + boutons ronds) */
  floatBtnSize: 44,
  floatPillHeight: 52,
  floatPadT: 6,
  floatPadB: 8,
  floatPadH: 10,
  floatGap: 8,
  floatPillPadL: 6,
  floatPillPadR: 16,
  subtitleSize: 12,
  /** Bandeau hors-ligne flottant sous l'en-tête */
  offlineBannerHeight: 32,
  /** Menu ⋮ */
  menuMinWidth: 260,
  menuGapBelowButton: 6,
  menuIconSize: 20,
  daySepPadV: 8,
  daySepFont: 12,
  /** boutons inline */
  btnPadV: 6,
  btnPadH: 10,
  btnRadius: 8,
  btnGap: 4,
  btnFont: 13,
  btnMarginT: 4,
  /** bouton callback_data grisé */
  btnOpacityEnabled: 1,
  btnOpacityDisabled: 0.55,
  /** non-texte libellé */
  kindLabelSize: 13,
  offlinePad: 8,
  /** cache local max messages (M4) */
  cacheLimit: 50,
  /** taille de page GET /messages */
  pageSize: 50,
  olderSpinnerMargin: 8,
  /** code — MessageBubble.css .message__code */
  codeFontFamily: 'monospace',
  /**
   * FlatList inverted — maintainVisibleContentPosition
   * (évite le saut quand le membre a remonté)
   */
  mvcMinIndex: 0,
  mvcAutoscrollThreshold: 10,
  /** .composer — ConversationPage.css */
  composerPad: 8,
  composerGap: 8,
  composerInputMinH: 40,
  composerInputMaxH: 120,
  composerInputPadV: 10,
  composerInputPadH: 12,
  composerInputRadius: 20,
  composerSendSize: 40,
  composerFontSize: 16,
  composerSendIconSize: 20,
  composerSendDisabledOpacity: 0.5,
  composerSendEnabledOpacity: 1,
  /** retry bouton — sans équivalent site */
  retryReadyOpacity: 1,
  retryWaitingOpacity: 0.5,
  /** seuil affiche compteur caractères */
  charCountThreshold: 3800,
  maxMessageLength: 4096,
  /** statut / retry */
  statusIconSize: 14,
  statusGap: 4,
  retryBtnPadV: 4,
  retryBtnPadH: 8,
  retryBtnRadius: 8,
  retryBtnFont: 12,
  /** .media-photo / .media-file — MessageBubble.css */
  mediaPhotoMaxH: 240,
  mediaPhotoRadius: 10,
  mediaFilePad: 10,
  mediaFileIconSize: 28,
  mediaAlbumGap: 2,
  mediaAlbumCellMin: 80,
  mediaBoxMinH: 80,
  mediaBoxGap: 8,
  /** sans équivalent site — auto DL photo */
  autoDownloadMaxBytes: 2 * 1024 * 1024,
  mediaAlbumColumns: 2,
  /** ComposerBar envoi en cours — sans équivalent site */
  composerSendingGap: 8,
  /** MessageStatus row margin-top — MessageBubble.css */
  statusMarginT: 4,

} as const;
