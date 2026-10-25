/**
 * UUID v4 — utilise react-native-get-random-values (déjà installé).
 */
import 'react-native-get-random-values';

export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  // getRandomValues polyfillé par react-native-get-random-values
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6]! & 0x0f) | 0x40;
  bytes[8] = (bytes[8]! & 0x3f) | 0x80;
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
