/**
 * Tokens et secrets uniquement via Keychain (S2).
 * Jamais dans MMKV, AsyncStorage, logs ou stores persistés.
 */
import * as Keychain from 'react-native-keychain';

const SERVICE = 'botgram.secure';

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
};

const ACCESS_KEY = 'access_token';
const REFRESH_KEY = 'refresh_token';
const MMKV_KEY_KEY = 'mmkv_encryption_key';

async function setPassword(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, {
    service: `${SERVICE}.${key}`,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
}

async function getPassword(key: string): Promise<string | null> {
  const result = await Keychain.getGenericPassword({
    service: `${SERVICE}.${key}`,
  });
  if (result === false) {
    return null;
  }
  return result.password;
}

async function resetPassword(key: string): Promise<void> {
  await Keychain.resetGenericPassword({
    service: `${SERVICE}.${key}`,
  });
}

/**
 * Écrit le refresh token AVANT l'access token (règle critique §5.3).
 */
export async function saveTokenPair(pair: TokenPair): Promise<void> {
  await setPassword(REFRESH_KEY, pair.refreshToken);
  await setPassword(ACCESS_KEY, pair.accessToken);
}

export async function getAccessToken(): Promise<string | null> {
  return getPassword(ACCESS_KEY);
}

export async function getRefreshToken(): Promise<string | null> {
  return getPassword(REFRESH_KEY);
}

export async function clearTokens(): Promise<void> {
  await resetPassword(ACCESS_KEY);
  await resetPassword(REFRESH_KEY);
}

/**
 * Clé d'encryption MMKV stockée dans Keychain (S3).
 * Générée une fois si absente.
 */
export async function getOrCreateMmkvKey(): Promise<string> {
  const existing = await getPassword(MMKV_KEY_KEY);
  if (existing !== null && existing.length >= 16) {
    return existing;
  }
  const generated = generateRandomKey(32);
  await setPassword(MMKV_KEY_KEY, generated);
  return generated;
}

function generateRandomKey(byteLength: number): string {
  // ATTENTION : Math.random n'est PAS un CSPRNG.
  // Cette implémentation est temporaire et non cryptographique.
  // Options proposées au propriétaire (voir LIVRAISONS.md) :
  // 1. Ajouter react-native-get-random-values (hors liste fermée) et utiliser crypto.getRandomValues.
  // 2. Générer la clé hors de l'app (env/secret CI) et l'injecter.
  // En attendant, on refuse de générer une clé faible.
  throw new Error(
    'Génération de clé MMKV non implémentée : CSPRNG requis. Voir LIVRAISONS.md pour les options.',
  );
}
