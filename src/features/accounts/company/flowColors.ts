/**
 * Couleurs « entreprise » pour les écrans qui lisent encore des `colors` Botgram (parcours d'association,
 * profil du bot, ajout d'un bot). Mêmes noms de clés, valeurs du thème entreprise : un écran passe
 * au style entreprise en changeant une seule ligne. `onAccent` = texte posé sur l'accent
 * (blanc en clair, sombre en mode sombre, toujours lisible).
 */
import {useMemo} from 'react';
import {useTheme} from '../../../shared/theme';
import {flowColorsFrom, type FlowColors} from './flowPalette';
import {useCompanyTheme} from './companyTheme';

export type {FlowColors};

export function useFlowColors(): FlowColors {
  const {colors, mode} = useTheme();
  const t = useCompanyTheme();
  return useMemo(() => flowColorsFrom(colors, t, mode === 'dark'), [colors, t, mode]);
}
