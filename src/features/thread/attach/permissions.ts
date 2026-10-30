/**
 * Permissions du panneau de pièces jointes : photos/vidéos (galerie) et caméra.
 * Android 13+ : READ_MEDIA_IMAGES / READ_MEDIA_VIDEO ; Android 14 : accès partiel possible
 * (READ_MEDIA_VISUAL_USER_SELECTED) ; Android 12 et moins : READ_EXTERNAL_STORAGE.
 */
import {PermissionsAndroid, Platform, type Permission} from 'react-native';

export type GalleryAccess =
  | 'unknown'
  | 'full'
  | 'limited'
  | 'denied'
  | 'blocked';

export type CameraAccess = 'unknown' | 'granted' | 'denied' | 'blocked';

const perm = (name: string): Permission =>
  `android.permission.${name}` as Permission;

const IMAGES = perm('READ_MEDIA_IMAGES');
const VIDEO = perm('READ_MEDIA_VIDEO');
const SELECTED = perm('READ_MEDIA_VISUAL_USER_SELECTED');
const STORAGE = perm('READ_EXTERNAL_STORAGE');
const CAMERA = perm('CAMERA');

const api = (): number => Number(Platform.Version);
const isAndroid = (): boolean => Platform.OS === 'android';

export async function checkGalleryAccess(): Promise<GalleryAccess> {
  if (!isAndroid()) return 'unknown';
  try {
    if (api() >= 33) {
      const [img, vid] = await Promise.all([
        PermissionsAndroid.check(IMAGES),
        PermissionsAndroid.check(VIDEO),
      ]);
      if (img && vid) return 'full';
      if (api() >= 34 && (await PermissionsAndroid.check(SELECTED))) {
        return 'limited';
      }
      return 'denied';
    }
    return (await PermissionsAndroid.check(STORAGE)) ? 'full' : 'denied';
  } catch {
    return 'unknown';
  }
}

export async function requestGalleryAccess(): Promise<GalleryAccess> {
  if (!isAndroid()) return 'unknown';
  try {
    if (api() >= 33) {
      const wanted = api() >= 34 ? [IMAGES, VIDEO, SELECTED] : [IMAGES, VIDEO];
      const res = await PermissionsAndroid.requestMultiple(wanted);
      const granted = PermissionsAndroid.RESULTS.GRANTED;
      if (res[IMAGES] === granted && res[VIDEO] === granted) return 'full';
      if (api() >= 34 && res[SELECTED] === granted) return 'limited';
      const never = PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
      return Object.values(res).includes(never) ? 'blocked' : 'denied';
    }
    const res = await PermissionsAndroid.request(STORAGE);
    if (res === PermissionsAndroid.RESULTS.GRANTED) return 'full';
    return res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ? 'blocked'
      : 'denied';
  } catch {
    return 'unknown';
  }
}

export async function checkCameraAccess(): Promise<CameraAccess> {
  if (!isAndroid()) return 'unknown';
  try {
    return (await PermissionsAndroid.check(CAMERA)) ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

export async function requestCameraAccess(): Promise<CameraAccess> {
  if (!isAndroid()) return 'unknown';
  try {
    const res = await PermissionsAndroid.request(CAMERA);
    if (res === PermissionsAndroid.RESULTS.GRANTED) return 'granted';
    return res === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN
      ? 'blocked'
      : 'denied';
  } catch {
    return 'unknown';
  }
}
