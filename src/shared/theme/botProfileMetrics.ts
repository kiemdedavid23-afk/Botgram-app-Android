/**
 * Métriques profil bot — site BotProfile.css + components.
 * Chaque valeur cite le sélecteur CSS source (BotProfile.css).
 */
import type {TextStyle} from 'react-native';

/** Tabs — .bp-tab / .bp-tabs (BotProfile.css) */
export const botProfileTabs = {
  /** .bp-tabs gap */
  gap: 6,
  /** .bp-tabs padding */
  paddingV: 6,
  paddingH: 14,
  /** .bp-tab min-height */
  tabMinHeight: 52,
  /** .bp-tab min-width */
  tabMinWidth: 66,
  /** .bp-tab border-radius */
  tabRadius: 14,
  /** .bp-tab font-size */
  tabFontSize: 11.5,
  /** .bp-tab font-weight */
  tabFontWeight: '600' as TextStyle['fontWeight'],
  /** .bp-tab padding */
  tabPaddingV: 6,
  tabPaddingH: 10,
  /** .bp-tab gap */
  tabGap: 3,
};

/** Commandes — .bp-cmds / .bp-cmd */
export const botProfileCmds = {
  /** .bp-cmds__head padding */
  headPaddingH: 16,
  headPaddingTop: 16,
  headPaddingBottom: 12,
  /** .bp-cmds__title */
  titleFontSize: 15,
  titleFontWeight: '700' as TextStyle['fontWeight'],
  /** .bp-cmd padding */
  itemPaddingV: 12,
  itemPaddingH: 16,
  itemGap: 8,
  /** .bp-cmd__slash */
  slashFontSize: 18,
  slashFontWeight: '700' as TextStyle['fontWeight'],
  /** .bp-cmds__actions gap/padding */
  actionsGap: 8,
  actionsPaddingH: 16,
  actionsPaddingV: 10,
};

/** Menu — .bp-menu */
export const botProfileMenu = {
  optionGap: 10,
  optionPaddingV: 12,
  optionPaddingH: 16,
  optionRadius: 14,
  fieldMarginTop: 12,
};

/** Droits — .bp-rights / .bp-switch */
export const botProfileRights = {
  /** .bp-switch width/height */
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

/** Héros L4b + agrégat */
export const botProfileMetrics = {
  heroMinHeight: 300,
  heroRadius: 22,
  heroAvatar: 104,
  ...botProfileTabs,
  ...botProfileCmds,
  ...botProfileMenu,
  ...botProfileRights,
  ...botProfilePreview,
};
