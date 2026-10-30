/**
 * Pont JS vers les modules natifs de la galerie et de la caméra (Kotlin).
 *  - BotgramGallery : photos et vidéos du téléphone, par pages
 *  - BotgramCamera  : prise de photo (l'aperçu est le composant BotgramCameraView)
 * Sûr si le module est absent (tests Jest, iOS) : tableau vide / null.
 */
import {NativeModules} from 'react-native';

export type GalleryAsset = {
  id: string;
  /** content:// — lisible par <Image> et par FormData. */
  uri: string;
  type: 'photo' | 'video';
  mime: string;
  name: string;
  size: number;
  durationMs: number;
  width: number;
  height: number;
  /** ms depuis 1970. */
  at: number;
};

export type CameraPhoto = {
  uri: string;
  name: string;
  mime: string;
  size: number;
};

type GalleryModule = {
  queryAssets(offset: number, limit: number): Promise<GalleryAsset[]>;
};
type CameraModule = {takePhoto(): Promise<CameraPhoto>};

export type PickedContact = {
  phone_number: string;
  first_name: string;
  last_name?: string;
};
type ContactPickerModule = {pickContact(): Promise<PickedContact | null>};

const gallery = NativeModules.BotgramGallery as GalleryModule | undefined;
const camera = NativeModules.BotgramCamera as CameraModule | undefined;

const contactPicker = NativeModules.BotgramContactPicker as
  | ContactPickerModule
  | undefined;

/** Ouvre le carnet d'adresses du système. null = annulé ou indisponible. Aucune permission. */
export async function pickContact(): Promise<PickedContact | null> {
  if (!contactPicker) return null;
  return contactPicker.pickContact();
}

export type DevicePosition = {
  latitude: number;
  longitude: number;
  /** Précision horizontale en mètres (0 si inconnue). */
  accuracy: number;
};
type LocationModule = {getCurrentPosition(): Promise<DevicePosition>};
const locationModule = NativeModules.BotgramLocation as
  | LocationModule
  | undefined;

/** Lève `permission_denied`, `location_disabled`, `unavailable` : l'appelant décide. */
export async function getCurrentPosition(): Promise<DevicePosition> {
  if (!locationModule) throw new Error('unavailable');
  return locationModule.getCurrentPosition();
}

export const isGalleryAvailable = (): boolean => gallery != null;

/** Lève une erreur (`permission_denied`, `query_failed`) : l'appelant décide. */
export async function queryGalleryAssets(
  offset: number,
  limit: number,
): Promise<GalleryAsset[]> {
  if (!gallery) return [];
  return gallery.queryAssets(offset, limit);
}

export async function takeCameraPhoto(): Promise<CameraPhoto | null> {
  if (!camera) return null;
  try {
    return await camera.takePhoto();
  } catch {
    return null;
  }
}
