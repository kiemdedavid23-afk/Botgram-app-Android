/**
 * Dimensions profil bot — BotProfile.css + composants L4b/L4c.
 * Fusion : clés L4b conservées + nouvelles clés L4c.
 * Aucune clé retirée par rapport à L4b.
 */
import type {TextStyle} from 'react-native';

/** Clés L4b (utilisées par BotHero, Identity, Info, LangChips, Languages, SaveBar, Screen) */
const l4b = {
  /** .bp-scroll padding 0 14px */
  scrollPadH: 14,
  scrollPadBottom: 110,
  scrollGap: 12,
  /** .bp-hero */
  heroMinHeight: 300,
  heroRadius: 22,
  heroPad: 16,
  /** --hero-avatar */
  heroAvatar: 104,
  heroNameSize: 22,
  heroNameWeight: '700' as const,
  /** onglets L4b */
  tabPadV: 10,
  tabPadH: 14,
  tabFont: 14,
  fieldGap: 10,
  inputHeight: 48,
  inputRadius: 14,
  saveBarPad: 14,
  saveBarHeight: 56,
  chipPadV: 6,
  chipPadH: 12,
  chipRadius: 99,
} as const;

/** Tabs L4c — .bp-tab / .bp-tabs (BotProfile.css) */
export const botProfileTabs = {
  gap: 6,
  paddingV: 6,
  paddingH: 14,
  tabMinHeight: 52,
  tabMinWidth: 66,
  tabRadius: 14,
  tabFontSize: 11.5,
  tabFontWeight: '600' as TextStyle['fontWeight'],
  tabPaddingV: 6,
  tabPaddingH: 10,
  tabGap: 3,
};

/** Commandes — .bp-cmds / .bp-cmd */
export const botProfileCmds = {
  headPaddingH: 16,
  headPaddingTop: 16,
  headPaddingBottom: 12,
  titleFontSize: 15,
  titleFontWeight: '700' as TextStyle['fontWeight'],
  itemPaddingV: 12,
  itemPaddingH: 16,
  itemGap: 8,
  slashFontSize: 18,
  slashFontWeight: '700' as TextStyle['fontWeight'],
  actionsGap: 8,
  actionsPaddingH: 16,
  actionsPaddingV: 10,
};

/** Menu */
export const botProfileMenu = {
  optionGap: 10,
  optionPaddingV: 12,
  optionPaddingH: 16,
  optionRadius: 14,
  fieldMarginTop: 12,
};

/** Droits — .bp-switch */
export const botProfileRights = {
  switchWidth: 52,
  switchHeight: 30,
  knobSize: 24,
  knobOffset: 3,
  knobTravel: 22,
  rowPaddingV: 12,
  rowPaddingH: 16,
  sectionGap: 16,
};

/** Aperçu — .bp-preview / .bp-phone */
export const botProfilePreview = {
  labelFontSize: 12,
  labelFontWeight: '700' as TextStyle['fontWeight'],
  labelLetterSpacing: 0.08,
  gridGap: 10,
  phoneRadius: 20,
  phonePadding: 12,
  emptyChatRadius: 16,
  emptyChatPaddingV: 12,
  emptyChatPaddingH: 14,
  menuPillPaddingV: 7,
  menuPillPaddingH: 12,
  menuPillRadius: 99,
  inputPillPaddingV: 7,
  inputPillPaddingH: 12,
};

/**
 * Agrégat unique exporté par theme/index.
 * Toutes les clés L4b + clés L4c (tabs/cmds/menu/rights/preview).
 * Aucune clé L4b retirée.
 */
export const botProfileMetrics = {
  ...l4b,
  ...botProfileTabs,
  ...botProfileCmds,
  ...botProfileMenu,
  ...botProfileRights,
  ...botProfilePreview,
};
