/**
 * Habillage « entreprise » : doux et aéré. Fond lavande très clair, grandes cartes très arrondies,
 * un accent vif pour l'élément principal (couleur de marque au choix, voir companyPalette),
 * pastilles blanches pour les actions.
 * Suit le mode clair / sombre de l'app ; polices système Android seulement.
 */
import {useEffect, useMemo} from 'react';
import {useTheme} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useWorkspaceStore} from '../store/workspaceStore';
import {useBrandStore} from '../store/brandStore';
import {
  BASE_DARK,
  BASE_LIGHT,
  BOT_TINTS,
  DEFAULT_BRAND_ID,
  brandById,
  type BaseTokens,
  type BrandId,
} from './companyPalette';

export type CompanyTokens = BaseTokens & {
  /** Accent de la marque (boutons pleins, icônes, indicateur d'actualisation). */
  primary: string;
  primaryHi: string;
  primarySoft: string;
  /** Dégradé des grandes cartes colorées (texte `onHero` dessus). */
  heroHi: string;
  heroLo: string;
  /** Teintes des pastilles de bot. */
  botTints: readonly string[];
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
  headerBtn: 40,
  headerBtnRadius: 14,
  chipRadius: 18,
  /** Tailles de texte : toutes ici, jamais déduites d'une marge. */
  nameSize: 24,
  titleSize: 22,
  rowTitleSize: 18,
  bodySize: 17,
  valueSize: 16,
  subSize: 15,
  captionSize: 13,
  greetSize: 16,
  heroValueSize: 44,
  tileValueSize: 28,
} as const;

/** Couleur de marque de l'entreprise (choisie sur cet appareil), ou celle par défaut. */
export function useBrandId(): BrandId {
  const wsId = useWorkspaceStore(s => s.workspaces[0]?.id ?? null);
  const chosen = useBrandStore(s => (wsId ? s.byWorkspace[wsId] : undefined));
  const hydrate = useBrandStore(s => s.hydrate);
  useEffect(() => {
    fireAndForget(hydrate());
  }, [hydrate]);
  return chosen ?? DEFAULT_BRAND_ID;
}

export function useCompanyTheme(): CompanyTokens {
  const dark = useTheme().mode === 'dark';
  const brandId = useBrandId();
  return useMemo(() => {
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
  }, [dark, brandId]);
}
