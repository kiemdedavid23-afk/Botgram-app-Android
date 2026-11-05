/** Texte d'état de l'installation, partagé par la bannière et la ligne de réglages. */
import type {InstallPhase} from './updateStore';
import {updateTexts as t} from './texts';

export function installStatusText(
  phase: InstallPhase,
  progress: number,
  installError: string | null,
): string | null {
  switch (phase) {
    case 'downloading':
      return t.downloading(progress > 0 ? Math.round(progress * 100) : null);
    case 'installing':
      return t.installing;
    case 'needsPermission':
      return t.needsPermission;
    case 'error':
      return installError;
    default:
      return null;
  }
}
