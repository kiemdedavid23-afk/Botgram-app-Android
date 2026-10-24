/**
 * Cache MMKV chiffré (S3).
 * La clé d'encryption est lue depuis Keychain via getOrCreateMmkvKey.
 * Ne jamais y stocker de tokens.
 */
import {MMKV, type MMKV as MMKVInstance} from 'react-native-mmkv';
import {getOrCreateMmkvKey} from './secureStorage';

let instance: MMKVInstance | null = null;
let initPromise: Promise<MMKVInstance> | null = null;

async function getInstance(): Promise<MMKVInstance> {
  if (instance) {
    return instance;
  }
  if (initPromise) {
    return initPromise;
  }
  initPromise = (async () => {
    const encryptionKey = await getOrCreateMmkvKey();
    instance = new MMKV({
      id: 'botgram-cache',
      encryptionKey,
    });
    return instance;
  })();
  return initPromise;
}

export async function cacheSetString(key: string, value: string): Promise<void> {
  const mmkv = await getInstance();
  mmkv.set(key, value);
}

export async function cacheGetString(key: string): Promise<string | undefined> {
  const mmkv = await getInstance();
  return mmkv.getString(key);
}

export async function cacheSetNumber(key: string, value: number): Promise<void> {
  const mmkv = await getInstance();
  mmkv.set(key, value);
}

export async function cacheGetNumber(key: string): Promise<number | undefined> {
  const mmkv = await getInstance();
  return mmkv.getNumber(key);
}

export async function cacheSetBoolean(key: string, value: boolean): Promise<void> {
  const mmkv = await getInstance();
  mmkv.set(key, value);
}

export async function cacheGetBoolean(key: string): Promise<boolean | undefined> {
  const mmkv = await getInstance();
  return mmkv.getBoolean(key);
}

export async function cacheDelete(key: string): Promise<void> {
  const mmkv = await getInstance();
  mmkv.delete(key);
}

export async function cacheClearAll(): Promise<void> {
  const mmkv = await getInstance();
  mmkv.clearAll();
}

/** Supprime toutes les clés dont le nom commence par `prefix` (13.5). */
export async function cacheDeleteByPrefix(prefix: string): Promise<void> {
  const mmkv = await getInstance();
  for (const key of mmkv.getAllKeys()) {
    if (key.startsWith(prefix)) {
      mmkv.delete(key);
    }
  }
}

/** Clé dédiée aux réglages d'apparence (distincte du site web). */
export const APPEARANCE_STORAGE_KEY = 'appearance';
