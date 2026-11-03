/**
 * 6bis-d — chiffrement médias (Node crypto branché, déclaré comme tel).
 */
import {
  setCryptoProvider,
  createNodeCryptoProvider,
  encryptAll,
  decryptAll,
  MediaDecryptError,
  BLOCK_SIZE,
  deriveMediaFileKeyFromMaster,
} from '../src/core/crypto';

beforeAll(() => {
  setCryptoProvider(createNodeCryptoProvider());
});

describe('media AES-GCM blocks', () => {
  const key = new Uint8Array(32).fill(7);

  it('aller-retour > 3 Mio (plusieurs blocs)', () => {
    const plain = new Uint8Array(3 * BLOCK_SIZE + 100);
    for (let i = 0; i < plain.length; i += 1) plain[i] = i % 251;
    const {enc, nonces} = encryptAll(plain, key);
    expect(nonces.length).toBeGreaterThan(3);
    // nonces distincts
    const seen = new Set(nonces.map(n => Buffer.from(n).toString('hex')));
    expect(seen.size).toBe(nonces.length);
    const out = decryptAll(enc, key);
    expect(out).toEqual(plain);
  });

  it('altération d’un octet → MediaDecryptError', () => {
    const plain = new Uint8Array(100).fill(1);
    const {enc} = encryptAll(plain, key);
    const bad = new Uint8Array(enc);
    bad[HEADER_SAFE()] = (bad[HEADER_SAFE()]! + 1) % 256;
    expect(() => decryptAll(bad, key)).toThrow(MediaDecryptError);
  });

  it('troncature → erreur', () => {
    const plain = new Uint8Array(50).fill(2);
    const {enc} = encryptAll(plain, key);
    expect(() => decryptAll(enc.subarray(0, enc.length - 5), key)).toThrow(
      MediaDecryptError,
    );
  });

  it('dérivation déterministe et distincte contextes', () => {
    const a = deriveMediaFileKeyFromMaster('master-key-32chars-minimum!!!!!!');
    const b = deriveMediaFileKeyFromMaster('master-key-32chars-minimum!!!!!!');
    const c = deriveMediaFileKeyFromMaster('other-master-key-32chars-minimum!');
    expect(Buffer.from(a).toString('hex')).toBe(Buffer.from(b).toString('hex'));
    expect(Buffer.from(a).toString('hex')).not.toBe(
      Buffer.from(c).toString('hex'),
    );
    expect(a.length).toBe(32);
  });
});

function HEADER_SAFE(): number {
  // past header into first nonce/ct
  return 20;
}
