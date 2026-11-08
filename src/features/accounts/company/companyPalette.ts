/**
 * Palette « entreprise » en TypeScript pur (aucun import React Native) : surfaces claires et
 * sombres, couleurs de marque proposées, teintes des bots. Séparée du thème pour pouvoir être
 * vérifiée par des tests de contraste (company-brand.test.ts).
 */

export type BrandId = 'indigo' | 'teal' | 'emerald' | 'orange' | 'rose' | 'violet' | 'slate';

export type BrandPreset = {
  id: BrandId;
  label: string;
  /** Dégradé des grandes cartes colorées : texte blanc lisible (≥ 4,5:1) sur les deux bouts. */
  heroHi: string;
  heroLo: string;
  /** Accent sur surface claire (boutons, liens, icônes) : ≥ 4,5:1 sur le fond et la carte, et texte blanc ≥ 4,5:1 dessus. */
  accentLight: string;
  /** Accent sur surface sombre : ≥ 4,5:1 sur la carte sombre, texte sombre dessus. */
  accentDark: string;
  /** Fond doux d'une pastille ou d'une option choisie. */
  softLight: string;
  softDark: string;
};

export const DEFAULT_BRAND_ID: BrandId = 'indigo';

export const BRAND_PRESETS: readonly BrandPreset[] = [
  {id: 'indigo', label: 'Indigo', heroHi: '#5364FC', heroLo: '#3E51FC', accentLight: '#3E51FC', accentDark: '#7482FD', softLight: '#E6E8FF', softDark: '#2C315B'},
  {id: 'teal', label: 'Turquoise', heroHi: '#20817D', heroLo: '#0A7570', accentLight: '#0A7570', accentDark: '#4C9A97', softLight: '#DFEDEC', softDark: '#243647'},
  {id: 'emerald', label: 'Émeraude', heroHi: '#258459', heroLo: '#0F7849', accentLight: '#0F7849', accentDark: '#4D9D79', softLight: '#E0EDE7', softDark: '#243741'},
  {id: 'orange', label: 'Orange', heroHi: '#BA5A22', heroLo: '#B2480A', accentLight: '#B2480A', accentDark: '#C87B4F', softLight: '#F5E7DF', softDark: '#3D3039'},
  {id: 'rose', label: 'Rose', heroHi: '#CA4475', heroLo: '#C32A62', accentLight: '#C32A62', accentDark: '#D86B92', softLight: '#F7E3EB', softDark: '#402D46'},
  {id: 'violet', label: 'Violet', heroHi: '#865AE2', heroLo: '#6A33DB', accentLight: '#6A33DB', accentDark: '#9E7AE8', softLight: '#ECE4FA', softDark: '#343057'},
  {id: 'slate', label: 'Ardoise', heroHi: '#6B768E', heroLo: '#3A4868', accentLight: '#3A4868', accentDark: '#858EA1', softLight: '#E5E7EB', softDark: '#2F3449'},
];

export function isBrandId(v: unknown): v is BrandId {
  return typeof v === 'string' && BRAND_PRESETS.some(p => p.id === v);
}

/** Préréglage demandé, ou celui par défaut si l'identifiant est inconnu ou absent. */
export function brandById(id: string | null | undefined): BrandPreset {
  const found = BRAND_PRESETS.find(p => p.id === id);
  return found ?? (BRAND_PRESETS[0] as BrandPreset);
}

/** Surfaces et textes qui ne dépendent pas de la couleur de marque. */
export type BaseTokens = {
  bg: string;
  bgGlow: string;
  card: string;
  cardEdge: string;
  tile: string;
  soft: string;
  ink: string;
  inkSoft: string;
  line: string;
  chipBorder: string;
  /** Texte posé sur l'accent (boutons pleins) : blanc en clair, sombre en mode sombre. */
  onPrimary: string;
  /** Texte posé sur les grands dégradés colorés : toujours blanc. */
  onHero: string;
  good: string;
  goodSoft: string;
  warn: string;
  warnSoft: string;
  bad: string;
  badSoft: string;
  shadow: string;
  /** Opacité de l'ombre des cartes (plus forte en sombre, sinon elle disparaît). */
  shadowOpacity: number;
};

export const BASE_LIGHT: BaseTokens = {
  bg: '#E8EBF5',
  bgGlow: '#D9DEF6',
  card: '#EEF0F8',
  cardEdge: 'rgba(255,255,255,0.85)',
  tile: '#FFFFFF',
  soft: '#F1F3FA',
  ink: '#2A2C3A',
  inkSoft: '#5A5E7A',
  line: '#DDE0EC',
  chipBorder: '#B3B9D1',
  onPrimary: '#FFFFFF',
  onHero: '#FFFFFF',
  good: '#14A36B',
  goodSoft: '#D9F3E8',
  warn: '#D68A0B',
  warnSoft: '#FBEBCB',
  bad: '#C2352C',
  badSoft: '#F9DDDA',
  shadow: '#3D4A9A',
  shadowOpacity: 0.1,
};

export const BASE_DARK: BaseTokens = {
  bg: '#0F1122',
  bgGlow: '#171A38',
  card: '#1A1D33',
  cardEdge: 'rgba(255,255,255,0.08)',
  tile: '#262A48',
  soft: '#1F2340',
  ink: '#ECEEF8',
  inkSoft: '#9197B2',
  line: '#2A2E4D',
  chipBorder: '#3A3F63',
  onPrimary: '#0B0D1C',
  onHero: '#FFFFFF',
  good: '#3CC38D',
  goodSoft: '#12302A',
  warn: '#E4A93A',
  warnSoft: '#33290F',
  bad: '#EB6A60',
  badSoft: '#3A1B19',
  shadow: '#000000',
  shadowOpacity: 0.5,
};

/** Teintes des pastilles de bot (lettre blanche dessus, ≥ 4,5:1), choisies d'après l'id du bot. */
export const BOT_TINTS: readonly string[] = ['#B84A0A', '#0F7A4A', '#6A33DB', '#C72B64', '#0B7F7A', '#3F52FF'];

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(hex: string): number {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
}

/** Rapport de contraste WCAG entre deux couleurs « #RRGGBB » (1 à 21). */
export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  const hi = Math.max(la, lb);
  const lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/** Jetons complets d'habillage entreprise (surfaces + couleur de marque), clairs ou sombres. */
export type CompanyTokens = BaseTokens & {
  /** Accent de la marque (boutons pleins, liens, icônes, indicateur d'actualisation). */
  primary: string;
  primaryHi: string;
  primarySoft: string;
  /** Dégradé des grandes cartes colorées (texte `onHero` dessus). */
  heroHi: string;
  heroLo: string;
  /** Teintes des pastilles de bot. */
  botTints: readonly string[];
};

export function companyTokensFor(dark: boolean, brandId: string | null | undefined): CompanyTokens {
  const b = brandById(brandId);
  const base = dark ? BASE_DARK : BASE_LIGHT;
  return {
    ...base,
    primary: dark ? b.accentDark : b.accentLight,
    primaryHi: dark ? b.accentDark : b.heroHi,
    primarySoft: dark ? b.softDark : b.softLight,
    heroHi: b.heroHi,
    heroLo: b.heroLo,
    botTints: BOT_TINTS,
  };
}
