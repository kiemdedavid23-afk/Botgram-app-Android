import {useTheme} from '../../../shared/theme';
import {companyFonts, useCompanyTheme} from '../../accounts/company/companyTheme';
import {accountTypeOf} from '../../accounts/accountType';
import {useAuthStore} from '../../auth';

export type TeamPalette = {
  company: boolean;
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  line: string;
  accent: string;
  onAccent: string;
  accentSoft: string;
  danger: string;
  good: string;
  overlay: string;
  radius: number;
  titleFont: string | undefined;
  labelFont: string | undefined;
};

/** Même écran, deux habillages : entreprise (marine/or) ou Botgram (invité). */
export function useTeamPalette(): TeamPalette {
  const {colors} = useTheme();
  const c = useCompanyTheme();
  const company = accountTypeOf(useAuthStore(s => s.member)) === 'company';
  if (company) {
    return {
      company,
      bg: c.bg,
      surface: c.surface,
      surfaceAlt: c.surfaceAlt,
      ink: c.ink,
      inkSoft: c.inkSoft,
      line: c.line,
      accent: c.navy,
      onAccent: c.onNavy,
      accentSoft: c.goldSoft,
      danger: c.bad,
      good: c.good,
      overlay: 'rgba(8,17,27,0.55)',
      radius: 4,
      titleFont: companyFonts.display,
      labelFont: companyFonts.label,
    };
  }
  return {
    company,
    bg: colors.bgSecondary,
    surface: colors.bgPrimary,
    surfaceAlt: colors.bgSecondary,
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
    titleFont: undefined,
    labelFont: undefined,
  };
}
