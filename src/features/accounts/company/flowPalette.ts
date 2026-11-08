/**
 * Couleurs « entreprise » sous les noms de clés Botgram (TypeScript pur, testable sans React Native).
 */
import type {ColorTokens} from '../../../shared/theme/colors';
import type {CompanyTokens} from './companyPalette';

export type FlowColors = ColorTokens & {onAccent: string};

/** Texte vert foncé lisible sur le fond « succès » clair. */
const SUCCESS_TEXT_LIGHT = '#0B6B44';

export function flowColorsFrom(base: ColorTokens, t: CompanyTokens, dark: boolean): FlowColors {
  return {
    ...base,
    bgPrimary: t.card,
    bgSecondary: t.bg,
    bgTertiary: t.line,
    textPrimary: t.ink,
    textSecondary: t.inkSoft,
    textHint: t.inkSoft,
    accent: t.primary,
    accentHover: t.primary,
    accentSoft: t.primarySoft,
    border: t.line,
    borderSoft: t.line,
    divider: t.line,
    danger: t.bad,
    dangerSoft: t.badSoft,
    warn: t.warn,
    success: t.good,
    successSoft: t.goodSoft,
    successText: dark ? t.good : SUCCESS_TEXT_LIGHT,
    black: t.shadow,
    heroText: t.onHero,
    heroTextMuted: t.onHero,
    heroChipBg: 'rgba(10,15,60,0.24)',
    heroChipBorder: 'rgba(255,255,255,0.28)',
    onAccent: t.onPrimary,
  };
}
