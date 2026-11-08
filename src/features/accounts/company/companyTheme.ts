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
import {DEFAULT_BRAND_ID, companyTokensFor, type BrandId, type CompanyTokens} from './companyPalette';

export type {CompanyTokens};

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
  return useMemo(() => companyTokensFor(dark, brandId), [dark, brandId]);
}
