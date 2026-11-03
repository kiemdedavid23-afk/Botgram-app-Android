/** Faux / bridge Node crypto — déclaré pour les tests jest. */
import * as nodeCrypto from 'crypto';
import type {Cipher, CryptoProvider} from './provider';

function wrapCipher(c: nodeCrypto.CipherGCM | nodeCrypto.DecipherGCM): Cipher {
  return {
    update(data: Uint8Array) {
      return new Uint8Array(c.update(Buffer.from(data)));
    },
    final() {
      return new Uint8Array(c.final());
    },
    getAuthTag() {
      return new Uint8Array((c as nodeCrypto.CipherGCM).getAuthTag());
    },
    setAAD(aad: Uint8Array) {
      c.setAAD(Buffer.from(aad));
    },
    setAuthTag(tag: Uint8Array) {
      (c as nodeCrypto.DecipherGCM).setAuthTag(Buffer.from(tag));
    },
  };
}

export function createNodeCryptoProvider(): CryptoProvider {
  return {
    randomBytes(n: number) {
      return new Uint8Array(nodeCrypto.randomBytes(n));
    },
    createCipheriv(algo, key, iv) {
      const c = nodeCrypto.createCipheriv(
        algo,
        Buffer.from(key),
        Buffer.from(iv),
      ) as nodeCrypto.CipherGCM;
      return wrapCipher(c);
    },
    createDecipheriv(algo, key, iv) {
      const c = nodeCrypto.createDecipheriv(
        algo,
        Buffer.from(key),
        Buffer.from(iv),
      ) as nodeCrypto.DecipherGCM;
      return wrapCipher(c);
    },
    hkdfSync(ikm, salt, info, length) {
      return new Uint8Array(
        nodeCrypto.hkdfSync(
          'sha256',
          Buffer.from(ikm),
          Buffer.from(salt),
          Buffer.from(info),
          length,
        ),
      );
    },
  };
}
