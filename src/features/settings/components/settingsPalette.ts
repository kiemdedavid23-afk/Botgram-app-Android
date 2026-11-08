import {useTheme, settingsMetrics as sm} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {accountTypeOf} from '../../accounts/accountType';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';

export type SettingsPalette = {
  /** Habillage entreprise (doux, grandes cartes, couleur de marque) ou habillage Botgram. */
  company: boolean;
  bg: string;
  bgGlow: string;
  headerBg: string;
  surface: string;
  cardRadius: number;
  cardMarginH: number;
  cardBorder: string;
  shadow: string;
  shadowOpacity: number;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  accentSoft: string;
  danger: string;
  /** Couleur, taille et police du titre d'une carte. */
  titleColor: string;
  titleSize: number;
  titleFont: string | undefined;
};

/**
 * Mêmes pages Paramètres, deux habillages : entreprise (comme le tableau de bord) pour un compte
 * entreprise ; Botgram (inchangé) pour les autres. Les briques communes lisent cette palette.
 */
export function useSettingsPalette(): SettingsPalette {
  const {colors} = useTheme();
  const c = useCompanyTheme();
  const company = accountTypeOf(useAuthStore(s => s.member)) === 'company';
  if (company) {
    return {
      company,
      bg: c.bg,
      bgGlow: c.bgGlow,
      headerBg: c.bg,
      surface: c.card,
      cardRadius: cm.cardRadius,
      cardMarginH: cm.pageH,
      cardBorder: c.cardEdge,
      shadow: c.shadow,
      shadowOpacity: c.shadowOpacity,
      ink: c.ink,
      inkSoft: c.inkSoft,
      line: c.line,
      accent: c.primary,
      accentSoft: c.primarySoft,
      danger: c.bad,
      titleColor: c.ink,
      titleSize: cm.titleSize,
      titleFont: companyFonts.display,
    };
  }
  return {
    company,
    bg: colors.bgSecondary,
    bgGlow: colors.bgSecondary,
    headerBg: colors.bgPrimary,
    surface: colors.bgPrimary,
    cardRadius: sm.cardRadius,
    cardMarginH: sm.cardMarginH,
    cardBorder: 'transparent',
    shadow: colors.borderSoft,
    shadowOpacity: 0,
    ink: colors.textPrimary,
    inkSoft: colors.textSecondary,
    line: colors.borderSoft,
    accent: colors.accent,
    accentSoft: colors.accentSoft,
    danger: colors.danger,
    titleColor: colors.accent,
    titleSize: 16,
    titleFont: undefined,
  };
}
