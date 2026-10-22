/**
 * Dimensions / rayons profil membre.
 * Sources : MemberProfilePage.css (fichier:ligne cités dans LIVRAISONS).
 */
export const memberProfileMetrics = {
  /** .mp-scroll padding 14 14 32, gap 22 — MemberProfilePage.css l.14-20 */
  scrollPadH: 14,
  scrollPadTop: 14,
  scrollPadBottom: 32,
  /** padding état vide (écran sans member) */
  emptyPad: 24,
  sectionGap: 22,
  /** .mp-hero radius 32, min-height 430, padding 44 24 38 — l.24-30 */
  heroRadius: 32,
  heroMinHeight: 430,
  heroPadTop: 44,
  heroPadH: 24,
  heroPadBottom: 38,
  /** orbes A 320 / B 240 — l.48-60 */
  orbA: 320,
  orbB: 240,
  orbARight: -90,
  orbATop: -130,
  orbBLeft: -80,
  orbBBottom: -110,
  orbFloatX: -10,
  orbFloatY: 12,
  orbADurationMs: 7000,
  orbBDurationMs: 9000,
  orbBDelayMs: 3000,
  /** avatar padding 5, anneau — l.68-74 */
  avatarPad: 5,
  avatarSize: 96,
  avatarFont: 36,
  /** name 34/800, org 16, chips margin-top 24 — l.95-120 */
  nameSize: 34,
  nameWeight: '800' as const,
  nameMarginTop: 24,
  orgSize: 16,
  orgMarginTop: 8,
  chipsMarginTop: 24,
  chipGap: 8,
  chipPadV: 7,
  chipPadH: 13,
  chipFont: 12.5,
  chipDot: 9,
  /** section title 12/700 letter-spacing .08em — l.145-152 */
  sectionTitleGap: 8,
  sectionTitlePadH: 4,
  sectionTitleSize: 12,
  sectionTitleLetter: 0.08,
  sectionInnerGap: 10,
  sectionHeadPadH: 4,
  /** edit btn padding 6 12, font 12.5 — l.154-165 */
  editBtnPadV: 6,
  editBtnPadH: 12,
  editBtnFont: 12.5,
  editBtnGap: 6,
  /** card radius 20 — l.172-178 */
  cardRadius: 20,
  /** row padding 14 16, gap 14, icon 38 radius 12 — l.186-210 */
  rowPadV: 14,
  rowPadH: 16,
  rowGap: 14,
  rowIcon: 38,
  rowIconRadius: 12,
  rowKeySize: 12,
  rowValSize: 15,
  /** badge 11/700 padding 3 10 — l.248-255 */
  badgeFont: 11,
  badgePadV: 3,
  badgePadH: 10,
  /** sheet radius 24 top, max-width 480 — l.290-300 */
  sheetRadius: 24,
  sheetMaxWidth: 480,
  sheetHeadPad: 18,
  sheetHeadPadH: 20,
  sheetHeadPadBottom: 6,
  sheetTitleSize: 18,
  sheetClose: 36,
  sheetBodyPadH: 20,
  sheetBodyPadV: 10,
  sheetBodyGap: 14,
  sheetHintSize: 12.5,
  sheetActionsPad: 14,
  sheetActionsPadH: 20,
  sheetActionsPadBottom: 20,
  sheetActionsGap: 10,
  /** field label 12.5, input height 48 radius 14 — l.330-350 */
  fieldLabelSize: 12.5,
  fieldGap: 6,
  fieldInputHeight: 48,
  fieldInputPadH: 14,
  fieldInputRadius: 14,
  fieldInputBorder: 1.5,
  fieldInputFont: 16,
  /** btn height 48 radius 14 font 15/700 — l.360-375 */
  btnHeight: 48,
  btnRadius: 14,
  btnFont: 15,
  /** dialog max 360 radius 22 — l.378-395 */
  dialogMaxWidth: 360,
  dialogRadius: 22,
  dialogPadTop: 22,
  dialogTitleSize: 17,
  dialogBodySize: 14,
  dialogPadH: 22,
  /** animations mp-fade 0.18s, mp-rise 0.26s / 0.22s dialog */
  fadeMs: 180,
  riseMs: 260,
  dialogRiseMs: 220,
  itemRiseMs: 380,
  staggerMs: 80,
} as const;
