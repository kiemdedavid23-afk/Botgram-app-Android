/**
 * Habillage « entreprise » : doux et aéré. Fond lavande très clair, grandes cartes très arrondies,
 * un bleu vif pour l'élément principal, pastilles blanches pour les actions.
 * Suit le mode clair / sombre de l'app ; polices système Android seulement.
 */
import {useTheme} from '../../../shared/theme';

export type CompanyTokens = {
  /** Fond de page (haut du dégradé). */
  bg: string;
  /** Fond de page (bas du dégradé, halo bleuté). */
  bgGlow: string;
  /** Carte. */
  card: string;
  /** Liseré clair d'une carte. */
  cardEdge: string;
  /** Pastille / tuile blanche posée sur une carte. */
  tile: string;
  /** Petit bouton carré de l'en-tête. */
  soft: string;
  ink: string;
  inkSoft: string;
  line: string;
  chipBorder: string;
  primary: string;
  primaryHi: string;
  primarySoft: string;
  onPrimary: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  shadow: string;
};

const LIGHT: CompanyTokens = {
  bg: '#E8EBF5',
  bgGlow: '#D9DEF6',
  card: '#EEF0F8',
  cardEdge: 'rgba(255,255,255,0.85)',
  tile: '#FFFFFF',
  soft: '#F1F3FA',
  ink: '#2A2C3A',
  inkSoft: '#767A90',
  line: '#DDE0EC',
  chipBorder: '#C5CADB',
  primary: '#3F52FF',
  primaryHi: '#6574FF',
  primarySoft: '#E3E7FF',
  onPrimary: '#FFFFFF',
  good: '#14A36B',
  goodSoft: '#D9F3E8',
  warn: '#D68A0B',
  warnSoft: '#FBEBCB',
  bad: '#D8453B',
  badSoft: '#F9DDDA',
  shadow: '#3D4A9A',
};

const DARK: CompanyTokens = {
  bg: '#0F1122',
  bgGlow: '#171A38',
  card: '#1A1D33',
  cardEdge: 'rgba(255,255,255,0.06)',
  tile: '#262A48',
  soft: '#1F2340',
  ink: '#ECEEF8',
  inkSoft: '#9197B2',
  line: '#2A2E4D',
  chipBorder: '#3A3F63',
  primary: '#6A79FF',
  primaryHi: '#8794FF',
  primarySoft: '#242A5C',
  onPrimary: '#FFFFFF',
  good: '#3CC38D',
  goodSoft: '#12302A',
  warn: '#E4A93A',
  warnSoft: '#33290F',
  bad: '#EB6A60',
  badSoft: '#3A1B19',
  shadow: '#000000',
};

/** Polices système Android : aucune police à embarquer. */
export const companyFonts = {
  /** Titres de carte, grands chiffres. */
  display: 'sans-serif-medium',
  /** Texte courant. */
  body: 'sans-serif',
  /** Valeurs, sous-titres appuyés. */
  value: 'sans-serif-medium',
} as const;

export const companyMetrics = {
  pageH: 16,
  pageTop: 4,
  pageBottom: 40,
  sectionGap: 16,
  cardRadius: 30,
  cardPad: 20,
  tile: 56,
  tileRadius: 16,
  arrowBtn: 34,
  headerBtn: 38,
  headerBtnRadius: 14,
  chipRadius: 18,
} as const;

export function useCompanyTheme(): CompanyTokens {
  return useTheme().mode === 'dark' ? DARK : LIGHT;
}
