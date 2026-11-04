/**
 * SEUL import d'exécution de react-native-quick-crypto dans le dépôt.
 * Pas d'appel à install() — pas de polyfill global.
 * Le module natif n'est pas typé de façon stable : on le regarde à travers
 * l'interface minimale `QcApi` ci-dessous (un seul passage par `unknown`).
 */
import QuickCrypto from 'react-native-quick-crypto';
import type {Cipher, CryptoProvider} from './provider';

type Bin = ArrayBuffer | Uint8Array;

type RawCipher = {
  update: (data: Uint8Array) => Bin;
  final: () => Bin;
  getAuthTag: () => Bin;
  setAAD: (aad: Uint8Array) => void;
  setAuthTag: (tag: Uint8Array) => void;
};

type QcApi = {
  createCipheriv: (algo: string, key: Uint8Array, iv: Uint8Array) => RawCipher;
  createDecipheriv: (
    algo: string,
    key: Uint8Array,
    iv: Uint8Array,
  ) => RawCipher;
  randomBytes: (n: number) => Bin;
  hkdfSync: (
    digest: string,
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ) => Bin;
};

function toBytes(b: Bin): Uint8Array {
  return b instanceof Uint8Array ? b : new Uint8Array(b);
}

function wrap(c: RawCipher): Cipher {
  return {
    update: data => toBytes(c.update(data)),
    final: () => toBytes(c.final()),
    getAuthTag: () => toBytes(c.getAuthTag()),
    setAAD: aad => c.setAAD(aad),
    setAuthTag: tag => c.setAuthTag(tag),
  };
}

export function createQuickCryptoProvider(): CryptoProvider {
  const qc = QuickCrypto as unknown as QcApi;
  return {
    randomBytes: n => toBytes(qc.randomBytes(n)),
    createCipheriv: (algo, key, iv) => wrap(qc.createCipheriv(algo, key, iv)),
    createDecipheriv: (algo, key, iv) =>
      wrap(qc.createDecipheriv(algo, key, iv)),
    hkdfSync: (ikm, salt, info, length) =>
      toBytes(qc.hkdfSync('sha256', ikm, salt, info, length)),
  };
}
