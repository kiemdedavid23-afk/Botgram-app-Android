import type {ViewStyle} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';
import {accountTypeOf} from '../../accounts/accountType';
import {useAuthStore} from '../../auth';

export type TeamPalette = {
  company: boolean;
  /** Fond de page (haut du dégradé pour l'entreprise). */
  bg: string;
  /** Bas du dégradé (entreprise) ; identique à `bg` pour l'invité. */
  bgGlow: string;
  surface: string;
  surfaceAlt: string;
  /** Champ de saisie : fond et liseré. */
  field: string;
  fieldBorder: string;
  /** Fond d'une option non choisie (rôle, personne). */
  optionBg: string;
  /** Tuile blanche posée sur une carte (entreprise) ; sinon fond de surface. */
  tile: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  danger: string;
  good: string;
  overlay: string;
  /** Rayon des éléments intérieurs (boutons, champs, options). */
  radius: number;
  /** Rayon des cartes et boîtes de dialogue. */
  cardRadius: number;
  /** Rayon haut des feuilles du bas. */
  sheetRadius: number;
  cardBorder: string;
  shadow: string;
  shadowOpacity: number;
  /** Liseré des boutons discrets (transparent hors entreprise). */
  ghostBorder: string;
  titleFont: string | undefined;
  labelFont: string | undefined;
};

/** Même écran, deux habillages : entreprise (doux, bleu vif, grandes cartes) ou Botgram (invité). */
export function useTeamPalette(): TeamPalette {
  const {colors} = useTheme();
  const c = useCompanyTheme();
  const company = accountTypeOf(useAuthStore(s => s.member)) === 'company';
  if (company) {
    return {
      company,
      bg: c.bg,
      bgGlow: c.bgGlow,
      surface: c.card,
      surfaceAlt: c.soft,
      field: c.tile,
      fieldBorder: c.chipBorder,
      optionBg: c.tile,
      tile: c.tile,
      ink: c.ink,
      inkSoft: c.inkSoft,
      line: c.line,
      accent: c.primary,
      onAccent: c.onPrimary,
      accentSoft: c.primarySoft,
      danger: c.bad,
      good: c.good,
      overlay: 'rgba(15,17,34,0.5)',
      radius: cm.tileRadius,
      cardRadius: cm.cardRadius,
      sheetRadius: cm.cardRadius,
      cardBorder: c.cardEdge,
      shadow: c.shadow,
      shadowOpacity: 0.1,
      ghostBorder: c.chipBorder,
      titleFont: companyFonts.display,
      labelFont: companyFonts.value,
    };
  }
  return {
    company,
    bg: colors.bgSecondary,
    bgGlow: colors.bgSecondary,
    surface: colors.bgPrimary,
    surfaceAlt: colors.bgSecondary,
    field: colors.bgSecondary,
    fieldBorder: colors.borderSoft,
    optionBg: colors.bgPrimary,
    tile: colors.bgPrimary,
    ink: colors.textPrimary,
    inkSoft: colors.textSecondary,
    line: colors.borderSoft,
    accent: colors.accent,
    onAccent: colors.white,
    accentSoft: colors.accentSoft,
    danger: colors.danger,
    good: colors.online,
    overlay: colors.overlay,
    radius: 14,
    cardRadius: 14,
    sheetRadius: 20,
    cardBorder: colors.borderSoft,
    shadow: colors.borderSoft,
    shadowOpacity: 0,
    ghostBorder: 'transparent',
    titleFont: undefined,
    labelFont: undefined,
  };
}

/** Style d'une carte : mêmes ombre, liseré et rayon que les cartes du tableau de bord entreprise. */
export function cardStyle(p: TeamPalette): ViewStyle {
  return {
    backgroundColor: p.surface,
    borderColor: p.cardBorder,
    borderWidth: 1,
    borderRadius: p.cardRadius,
    shadowColor: p.shadow,
    shadowOpacity: p.shadowOpacity,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: p.company ? 3 : 0,
    overflow: p.company ? 'visible' : 'hidden',
  };
}
