import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';

export type SettingsPalette = {
  bg: string;
  bgGlow: string;
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
  titleFont: string;
};

/** Palette des pages Paramètres : celle de l'entreprise (couleur de marque comprise), pour tous les comptes. */
export function useSettingsPalette(): SettingsPalette {
  const c = useCompanyTheme();
  return {
    bg: c.bg,
    bgGlow: c.bgGlow,
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
