/**
 * Encodeur base64 pur (RFC 4648) — sans btoa / Buffer (RN).
 * Arithmétique uniquement (pas d'opérateurs bit à bit).
 */

const TABLE =
  'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

/** ArrayBuffer → base64. */
export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const len = bytes.length;
  const parts: string[] = [];
  let acc = '';
  const flushAt = 32768;

  let i = 0;
  while (i + 2 < len) {
    const n = bytes[i]! * 65536 + bytes[i + 1]! * 256 + bytes[i + 2]!;
    acc += TABLE[Math.floor(n / 262144) % 64]!;
    acc += TABLE[Math.floor(n / 4096) % 64]!;
    acc += TABLE[Math.floor(n / 64) % 64]!;
    acc += TABLE[n % 64]!;
    i += 3;
    if (acc.length >= flushAt) {
      parts.push(acc);
      acc = '';
    }
  }

  if (i < len) {
    const a = bytes[i]!;
    if (i + 1 < len) {
      const b = bytes[i + 1]!;
      const n = a * 65536 + b * 256;
      acc += TABLE[Math.floor(n / 262144) % 64]!;
      acc += TABLE[Math.floor(n / 4096) % 64]!;
      acc += TABLE[Math.floor(n / 64) % 64]!;
      acc += '=';
    } else {
      const n = a * 65536;
      acc += TABLE[Math.floor(n / 262144) % 64]!;
      acc += TABLE[Math.floor(n / 4096) % 64]!;
      acc += '==';
    }
  }

  if (acc) parts.push(acc);
  return parts.join('');
}
