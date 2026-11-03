/**
 * SEUL import d'exécution de react-native-quick-crypto dans le dépôt.
 * Pas d'appel à install() — pas de polyfill global.
 */
import QuickCrypto from 'react-native-quick-crypto';
import type {Cipher, CryptoProvider} from './provider';

type Qc = typeof QuickCrypto;

function wrap(c: {
  update: (d: ArrayBuffer | Uint8Array) => ArrayBuffer | Uint8Array;
  final: () => ArrayBuffer | Uint8Array;
  getAuthTag?: () => ArrayBuffer | Uint8Array;
  setAAD?: (a: ArrayBuffer | Uint8Array) => void;
  setAuthTag?: (t: ArrayBuffer | Uint8Array) => void;
}): Cipher {
  return {
    update(data: Uint8Array) {
      const out = c.update(data);
      return out instanceof Uint8Array ? out : new Uint8Array(out);
    },
    final() {
      const out = c.final();
      return out instanceof Uint8Array ? out : new Uint8Array(out);
    },
    getAuthTag() {
      const tag = c.getAuthTag?.() ?? new Uint8Array(16);
      return tag instanceof Uint8Array ? tag : new Uint8Array(tag);
    },
    setAAD(aad: Uint8Array) {
      c.setAAD?.(aad);
    },
    setAuthTag(tag: Uint8Array) {
      c.setAuthTag?.(tag);
    },
  };
}

export function createQuickCryptoProvider(): CryptoProvider {
  const qc = QuickCrypto as Qc & {
    createCipheriv: (
      a: string,
      k: Uint8Array,
      iv: Uint8Array,
    ) => Parameters<typeof wrap>[0];
    createDecipheriv: (
      a: string,
      k: Uint8Array,
      iv: Uint8Array,
    ) => Parameters<typeof wrap>[0];
    randomBytes: (n: number) => Uint8Array;
    hkdfSync?: (
      digest: string,
      ikm: Uint8Array,
      salt: Uint8Array,
      info: Uint8Array,
      len: number,
    ) => Uint8Array;
  };
  return {
    randomBytes(n: number) {
      const b = qc.randomBytes(n);
      return b instanceof Uint8Array ? b : new Uint8Array(b as ArrayBuffer);
    },
    createCipheriv(algo, key, iv) {
      return wrap(qc.createCipheriv(algo, key, iv));
    },
    createDecipheriv(algo, key, iv) {
      return wrap(qc.createDecipheriv(algo, key, iv));
    },
    hkdfSync(ikm, salt, info, length) {
      if (typeof qc.hkdfSync === 'function') {
        const out = qc.hkdfSync('sha256', ikm, salt, info, length);
        return out instanceof Uint8Array ? out : new Uint8Array(out);
      }
      // Fallback minimal si API absente : concat (tests RN uniquement via node)
      throw new Error('hkdfSync indisponible sur quick-crypto');
    },
  };
}
