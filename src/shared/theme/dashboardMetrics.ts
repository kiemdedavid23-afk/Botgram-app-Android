/**
 * Dimensions / rayons du tableau de bord.
 * Sources : site DashboardPage.css, AddBotPage.css, settings-common.css.
 */
export const dashboardMetrics = {
  /** DashboardPage.css .dash — padding 14 14 32 */
  pagePaddingH: 14,
  pagePaddingTop: 14,
  pagePaddingBottom: 32,
  /** gap 22 entre sections */
  sectionGap: 22,
  /** .dash-hero radius 28, min-height 250, padding 30 24 24 */
  heroRadius: 28,
  heroMinHeight: 250,
  heroPaddingTop: 30,
  heroPaddingH: 24,
  heroPaddingBottom: 24,
  /** orbe A 240, B 180 */
  orbA: 240,
  orbB: 180,
  /** salutation 32/800 */
  greetSize: 32,
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
  /** compte pastille 38 radius 12, icône 18 */
  accountIconBox: 38,
  accountIconRadius: 12,
  accountIconSize: 18,
  accountRowPadV: 14,
  accountRowPadH: 16,
  accountRowGap: 14,
  accountKeySize: 12,
  accountValSize: 14.5,
  /** SettingsShell / chat-settings__header */
  subHeaderPadTop: 8,
  subHeaderPadRight: 8,
  subHeaderPadBottom: 8,
  subHeaderPadLeft: 4,
  subHeaderTitleSize: 18,
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
  pressScale: 0.985,
} as const;
