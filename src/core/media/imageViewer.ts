/**
 * Visionneuse d'images native (Android) — point d'entrée unique pour toute l'app :
 * photos des conversations, albums, photo du bot, photo du contact, photo du membre…
 *
 * Usage :  openImageViewer([{uri: 'file:///…/photo'}], 0)
 * Retourne false si la visionneuse native n'est pas disponible (iOS, ancienne version de l'app) :
 * l'appelant peut alors garder son affichage de secours.
 */
import {NativeModules, Platform} from 'react-native';

export type ViewerImage = {
  /** Chemin local, file://, content:// ou https://. Enregistrer/partager : fichiers locaux seulement. */
  uri: string;
  /** Légende affichée en bas (facultatif). */
  title?: string | null;
};

type NativeViewer = {open?: (itemsJson: string, index: number) => void};

function nativeViewer(): NativeViewer | undefined {
  if (Platform.OS !== 'android') return undefined;
  return NativeModules.BotgramImageViewer as NativeViewer | undefined;
}

export function isImageViewerAvailable(): boolean {
  return typeof nativeViewer()?.open === 'function';
}

/** Ouvre la visionneuse sur `items[index]`. Jamais d'exception : false en cas d'échec. */
export function openImageViewer(items: ViewerImage[], index = 0): boolean {
  const mod = nativeViewer();
  if (!mod?.open || items.length === 0) return false;
  const safeIndex = Math.min(Math.max(index, 0), items.length - 1);
  try {
    mod.open(
      JSON.stringify(items.map(i => ({uri: i.uri, title: i.title ?? ''}))),
      safeIndex,
    );
    return true;
  } catch {
    return false;
  }
}
