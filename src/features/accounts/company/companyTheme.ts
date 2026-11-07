/**
 * Habillage « entreprise » : volontairement distinct du thème Botgram.
 * Marine et or sur gris froid, angles droits, filets fins, titres à empattements,
 * étiquettes en capitales condensées. Suit le mode clair / sombre de l'app.
 */
import {useTheme} from '../../../shared/theme';

export type CompanyTokens = {
  bg: string;
  surface: string;
  surfaceAlt: string;
  ink: string;
  inkSoft: string;
  line: string;
  lineStrong: string;
  navy: string;
  onNavy: string;
  gold: string;
  goldSoft: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
};

const LIGHT: CompanyTokens = {
  bg: '#EDF0F4',
  surface: '#FFFFFF',
  surfaceAlt: '#F6F8FA',
  ink: '#0B2239',
  inkSoft: '#586A7E',
  line: '#D9E0E8',
  lineStrong: '#B7C3D1',
  navy: '#0F2A47',
  onNavy: '#F4F7FB',
  gold: '#B9852B',
  goldSoft: '#F6EBD4',
  good: '#1B8A5F',
  goodSoft: '#DDF1E8',
  warn: '#B87708',
  warnSoft: '#FAEBCB',
  bad: '#B83B32',
  badSoft: '#F7DEDB',
};

const DARK: CompanyTokens = {
  bg: '#08111B',
  surface: '#101C2B',
  surfaceAlt: '#0C1724',
  ink: '#E7EEF6',
  inkSoft: '#8DA0B5',
  line: '#1F3046',
  lineStrong: '#31475F',
  navy: '#060D15',
  onNavy: '#E7EEF6',
  gold: '#E2B25C',
  goldSoft: '#2B2414',
  good: '#3CC38D',
  goodSoft: '#12302A',
  warn: '#E4A93A',
  warnSoft: '#33290F',
  bad: '#EB6A60',
  badSoft: '#3A1B19',
};

/** Polices système Android : aucune police à embarquer. */
export const companyFonts = {
  /** Titres, grands chiffres. */
  display: 'serif',
  /** Étiquettes en capitales. */
  label: 'sans-serif-condensed',
  /** Texte courant. */
  body: 'sans-serif',
  /** Valeurs, chiffres de tableau. */
  value: 'sans-serif-medium',
} as const;

export const companyMetrics = {
  pageH: 16,
  pageTop: 16,
  pageBottom: 40,
  sectionGap: 20,
  /** Angles quasi droits : l'inverse des cartes arrondies de Botgram. */
  radius: 4,
  rail: 3,
  monogram: 40,
  labelSize: 11,
  labelSpacing: 1.4,
} as const;

export function useCompanyTheme(): CompanyTokens {
  const {mode} = useTheme();
  return mode === 'dark' ? DARK : LIGHT;
}
