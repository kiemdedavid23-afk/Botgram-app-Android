/**
 * AES-256-GCM par blocs de 1 Mio.
 *
 * En-tête (16 o) : magic BGME | version=1 | reserved | block_size u32 BE | reserved u32
 * Bloc : nonce 12 | ct_len u32 BE | ciphertext | tag 16
 * AAD = block_index u32 BE || is_last u8 (anti-réordonnancement / troncature)
 * Nonces : 12 o CSPRNG distincts par bloc.
 */
import {getCryptoProvider} from './provider';

export const BLOCK_SIZE = 1024 * 1024;
export const HEADER_SIZE = 16;
export const NONCE_SIZE = 12;
export const TAG_SIZE = 16;
export const CIPHER_VERSION = 1;
const MAGIC = [0x42, 0x47, 0x4d, 0x45];

export class MediaDecryptError extends Error {
  readonly code = 'MEDIA_DECRYPT_ERROR';
  constructor(message: string) {
    super(message);
    this.name = 'MediaDecryptError';
  }
}

function u32be(n: number): Uint8Array {
  const b = new Uint8Array(4);
  b[0] = (n >>> 24) & 0xff;
  b[1] = (n >>> 16) & 0xff;
  b[2] = (n >>> 8) & 0xff;
  b[3] = n & 0xff;
  return b;
}

function readU32be(buf: Uint8Array, off: number): number {
  return (
    ((buf[off]! << 24) |
      (buf[off + 1]! << 16) |
      (buf[off + 2]! << 8) |
      buf[off + 3]!) >>>
    0
  );
}

function concat(parts: Uint8Array[]): Uint8Array {
  let len = 0;
  for (const p of parts) len += p.length;
  const out = new Uint8Array(len);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

function aadFor(index: number, isLast: boolean): Uint8Array {
  return concat([u32be(index), new Uint8Array([isLast ? 1 : 0])]);
}

export function buildHeader(blockSize: number = BLOCK_SIZE): Uint8Array {
  const h = new Uint8Array(HEADER_SIZE);
  h.set(MAGIC, 0);
  h[4] = CIPHER_VERSION;
  h[5] = 0;
  h.set(u32be(blockSize), 6);
  return h;
}

export function parseHeader(buf: Uint8Array): {blockSize: number} {
  if (buf.length < HEADER_SIZE) {
    throw new MediaDecryptError('en-tête tronqué');
  }
  if (
    buf[0] !== MAGIC[0] ||
    buf[1] !== MAGIC[1] ||
    buf[2] !== MAGIC[2] ||
    buf[3] !== MAGIC[3]
  ) {
    throw new MediaDecryptError('magic invalide');
  }
  if (buf[4] !== CIPHER_VERSION) {
    throw new MediaDecryptError('version cipher inconnue');
  }
  return {blockSize: readU32be(buf, 6)};
}

export function encryptAll(
  plain: Uint8Array,
  key: Uint8Array,
): {enc: Uint8Array; nonces: Uint8Array[]} {
  const crypto = getCryptoProvider();
  const nonces: Uint8Array[] = [];
  const parts: Uint8Array[] = [buildHeader()];
  const blockCount =
    plain.length === 0 ? 1 : Math.ceil(plain.length / BLOCK_SIZE);

  for (let i = 0; i < blockCount; i += 1) {
    const start = i * BLOCK_SIZE;
    const chunk = plain.subarray(start, start + BLOCK_SIZE);
    const isLast = i === blockCount - 1;
    const nonce = crypto.randomBytes(NONCE_SIZE);
    nonces.push(new Uint8Array(nonce));
    const cipher = crypto.createCipheriv('aes-256-gcm', key, nonce);
    cipher.setAAD(aadFor(i, isLast));
    const ct = concat([cipher.update(chunk), cipher.final()]);
    const tag = cipher.getAuthTag();
    parts.push(nonce, u32be(ct.length), ct, tag);
  }
  return {enc: concat(parts), nonces};
}

export function decryptAll(enc: Uint8Array, key: Uint8Array): Uint8Array {
  if (enc.length < HEADER_SIZE) {
    throw new MediaDecryptError('fichier tronqué');
  }
  parseHeader(enc.subarray(0, HEADER_SIZE));
  let offset = HEADER_SIZE;
  const plains: Uint8Array[] = [];
  let index = 0;
  const crypto = getCryptoProvider();
  let sawLast = false;

  while (offset < enc.length) {
    if (sawLast) {
      throw new MediaDecryptError('données après dernier bloc');
    }
    if (offset + NONCE_SIZE + 4 + TAG_SIZE > enc.length) {
      throw new MediaDecryptError('bloc tronqué');
    }
    const nonce = enc.subarray(offset, offset + NONCE_SIZE);
    offset += NONCE_SIZE;
    const ctLen = readU32be(enc, offset);
    offset += 4;
    if (offset + ctLen + TAG_SIZE > enc.length) {
      throw new MediaDecryptError('bloc tronqué');
    }
    const ct = enc.subarray(offset, offset + ctLen);
    offset += ctLen;
    const tag = enc.subarray(offset, offset + TAG_SIZE);
    offset += TAG_SIZE;

    const isLast = offset >= enc.length;
    try {
      const decipher = crypto.createDecipheriv('aes-256-gcm', key, nonce);
      decipher.setAAD(aadFor(index, isLast));
      decipher.setAuthTag(tag);
      plains.push(concat([decipher.update(ct), decipher.final()]));
    } catch {
      throw new MediaDecryptError('tag ou AAD invalide');
    }
    if (isLast) sawLast = true;
    index += 1;
  }

  if (!sawLast && index === 0) {
    throw new MediaDecryptError('aucun bloc');
  }
  return concat(plains);
}
