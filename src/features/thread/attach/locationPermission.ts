/** Permission de localisation (position partagée dans une conversation). */
import {PermissionsAndroid, Platform, type Permission} from 'react-native';

export type LocationAccess = 'unknown' | 'granted' | 'denied' | 'blocked';

const FINE = 'android.permission.ACCESS_FINE_LOCATION' as Permission;
const COARSE = 'android.permission.ACCESS_COARSE_LOCATION' as Permission;

export async function checkLocationAccess(): Promise<LocationAccess> {
  if (Platform.OS !== 'android') return 'unknown';
  try {
    const [f, c] = await Promise.all([
      PermissionsAndroid.check(FINE),
      PermissionsAndroid.check(COARSE),
    ]);
    return f || c ? 'granted' : 'denied';
  } catch {
    return 'unknown';
  }
}

export async function requestLocationAccess(): Promise<LocationAccess> {
  if (Platform.OS !== 'android') return 'unknown';
  try {
    const res = await PermissionsAndroid.requestMultiple([FINE, COARSE]);
    const ok = PermissionsAndroid.RESULTS.GRANTED;
    if (res[FINE] === ok || res[COARSE] === ok) return 'granted';
    const never = PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN;
    return res[FINE] === never || res[COARSE] === never ? 'blocked' : 'denied';
  } catch {
    return 'unknown';
  }
}
