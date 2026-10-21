/**
 * Dimensions / rayons du tableau de bord.
 * Sources : site DashboardPage.css, AddBotPage.css, settings-common.css.
 */
export const dashboardMetrics = {
  /** DashboardPage.css .db-scroll — padding 14 14 32 */
  pagePaddingH: 14,
  pagePaddingTop: 14,
  pagePaddingBottom: 32,
  /** gap 22 entre sections */
  sectionGap: 22,
  /** .db-section gap 10 */
  sectionInnerGap: 10,
  /** .db-hero radius 28, min-height 250, padding 30 24 24 */
  heroRadius: 28,
  heroMinHeight: 250,
  heroPaddingTop: 30,
  heroPaddingH: 24,
  heroPaddingBottom: 24,
  /** orbe A 240, B 180 */
  orbA: 240,
  orbB: 180,
  orbARight: -60,
  orbATop: -90,
  orbBLeft: -50,
  orbBBottom: -80,
  /** db-float l.64-66 : translate(-10px, 12px) */
  orbFloatX: -10,
  orbFloatY: 12,
  /** orbe A 7s, B 9s, B delay -3s */
  orbADurationMs: 7000,
  orbBDurationMs: 9000,
  orbBDelayMs: 3000,
  /** salutation 32/800 */
  greetSize: 32,
  greetWeight: '800' as const,
  /** sous-titre 15.5 */
  heroSubSize: 15.5,
  heroSubMarginTop: 10,
  /** pastilles margin-top 20, gap 10, padding 8 14 */
  chipMarginTop: 20,
  chipGap: 10,
  chipPadV: 8,
  chipPadH: 14,
  chipRadius: 99,
  chipFont: 13,
  chipIcon: 14,
  chipIconGap: 7,
  /** section label 12/700 letter-spacing .08em */
  sectionLabelSize: 12,
  sectionLabelPadH: 4,
  sectionHeadGap: 8,
  /** compteur bots padding 3 10 */
  countPadV: 3,
  countPadH: 10,
  /** liste bots gap 10 */
  botListGap: 10,
  /** carte bot padding 14 16, gap 14, radius 20 */
  botCardPadV: 14,
  botCardPadH: 16,
  botCardGap: 14,
  botCardRadius: 20,
  botCardBorderW: 1,
  /** icône bot 48 radius 16 */
  botIconBox: 48,
  botIconRadius: 16,
  botIconSize: 22,
  onlineDot: 13,
  onlineDotBorder: 2,
  onlineDotOffset: -3,
  /** nom 15.5, pastille état 11 */
  botNameSize: 15.5,
  statusFont: 11,
  statusPadV: 3,
  statusPadH: 10,
  statusRadius: 99,
  chevron: 16,
  /** quota anneau 88, r=36, stroke 8 */
  ringSize: 88,
  ringRadius: 36,
  ringStroke: 8,
  quotaCardPad: 16,
  quotaCardGap: 18,
  quotaPctSize: 18,
  quotaUsedSize: 22,
  quotaLimitSize: 15,
  quotaHintSize: 12,
  quotaHintLine: 12.5,
  quotaHintMarginTop: 8,
  /** compte pastille 38 radius 12, icône 18 */
  accountIconBox: 38,
  accountIconRadius: 12,
  accountIconSize: 18,
  accountRowPadV: 14,
  accountRowPadH: 16,
  accountRowGap: 14,
  accountKeySize: 12,
  accountValSize: 14.5,
  accountSepMarginH: 16,
  accountBadgeFont: 11,
  accountBadgePadV: 3,
  accountBadgePadH: 10,
  /** SettingsShell / chat-settings__header */
  subHeaderPadTop: 8,
  subHeaderPadRight: 8,
  subHeaderPadBottom: 8,
  subHeaderPadLeft: 4,
  subHeaderTitleSize: 18,
  subHeaderBackSize: 36,
  /** AddBotPage */
  addbotPadH: 12,
  addbotPadTop: 12,
  addbotPadBottom: 28,
  addbotGap: 20,
  addbotIntroSize: 15,
  addbotCardRadius: 16,
  addbotCardPad: 16,
  addbotCardGap: 14,
  addbotIconBox: 52,
  addbotIconRadius: 14,
  addbotIconSize: 26,
  addbotTitleSize: 16,
  addbotDescSize: 14,
  addbotHelpSize: 13,
  addbotPlusIcon: 20,
  addbotLabelSize: 15,
  /** .db-slot:active scale 0.985, 0.15s — DashboardPage.css l.195 */
  pressScale: 0.985,
  pressDurationMs: 150,
  /** empty slot border 2 dashed */
  emptyBorderW: 2,
  /** shadowSm approx */
  shadowElevation: 1,
  shadowOpacity: 0.06,
  shadowRadius: 2,
  shadowOffsetY: 1,
  /** font weights used in dashboard */
  weight600: '600' as const,
  weight700: '700' as const,
  weight800: '800' as const,
} as const;
