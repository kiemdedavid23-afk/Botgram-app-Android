/**
 * UUID v4 — utilise react-native-get-random-values (déjà installé).
 * Pas d'opérateurs bit à bit (eslint no-bitwise) : arithmétique équivalente RFC 4122.
 */
import 'react-native-get-random-values';

export function uuidV4(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  // version 4 : nibble haut = 4
  bytes[6] = 0x40 + (bytes[6]! % 16);
  // variante RFC 4122 : 10xxxxxx → 0x80 + (b % 64)
  bytes[8] = 0x80 + (bytes[8]! % 64);
  const hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
