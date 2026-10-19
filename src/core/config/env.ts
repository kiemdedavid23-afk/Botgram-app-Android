/**
 * SEUL lecteur de la config de build (R7).
 * Les valeurs réelles sont injectées à la compilation (react-native-config + secret CI).
 * Placeholder documenté : https://api.exemple.invalid/v1
 */
import Config from 'react-native-config';

export type AppChannel = 'direct' | 'play' | 'other';

function readString(key: string, fallback: string): string {
  const value = Config[key];
  if (typeof value === 'string' && value.length > 0) {
    return value;
  }
  return fallback;
}

function readInt(key: string, fallback: number): number {
  const raw = Config[key];
  if (typeof raw === 'string' && raw.length > 0) {
    const n = Number.parseInt(raw, 10);
    if (!Number.isNaN(n)) {
      return n;
    }
  }
  return fallback;
}

const apiUrl = readString('API_URL', 'https://api.exemple.invalid/v1');
const appChannelRaw = readString('APP_CHANNEL', 'direct');
const appChannel: AppChannel =
  appChannelRaw === 'play' || appChannelRaw === 'other' ? appChannelRaw : 'direct';

export const env = {
  apiUrl,
  appChannel,
  appBuild: readInt('APP_BUILD', 1),
  appVersion: readString('APP_VERSION', '1.0.0'),
  platform: 'android' as const,
} as const;

export type Env = typeof env;
