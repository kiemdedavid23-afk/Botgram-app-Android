/**
 * 6bis-d — chiffrement médias (Node crypto branché derrière la même
 * interface que quick-crypto : déclaré comme tel). Le module natif
 * (quickProvider) n'est jamais chargé ici.
 */
import {setCryptoProvider} from '../src/core/crypto/provider';
import {createNodeCryptoProvider} from '../src/core/crypto/nodeProvider';
import {
  encryptAll,
  decryptAll,
  MediaDecryptError,
  BLOCK_SIZE,
  HEADER_SIZE,
  NONCE_SIZE,
  TAG_SIZE,
} from '../src/core/crypto/aesGcmBlocks';
import {deriveMediaFileKeyFromMaster} from '../src/core/crypto/keys';

const FULL_BLOCK = NONCE_SIZE + 4 + BLOCK_SIZE + TAG_SIZE;

function sample(size: number): Uint8Array {
  const plain = new Uint8Array(size);
  for (let i = 0; i < plain.length; i += 1) {
    plain[i] = i % 251;
  }
  return plain;
}

beforeAll(() => {
  setCryptoProvider(createNodeCryptoProvider());
});

describe('media AES-GCM blocks', () => {
  const key = new Uint8Array(32).fill(7);

  it('aller-retour > 3 Mio (plusieurs blocs), nonces distincts', () => {
    const plain = sample(3 * BLOCK_SIZE + 100);
    const {enc, nonces} = encryptAll(plain, key);
    expect(nonces.length).toBe(4);
    const seen = new Set(nonces.map(n => Buffer.from(n).toString('hex')));
    expect(seen.size).toBe(nonces.length);
    expect(decryptAll(enc, key)).toEqual(plain);
  });

  it('fichier vide : aller-retour', () => {
    const {enc} = encryptAll(new Uint8Array(0), key);
    expect(decryptAll(enc, key).length).toBe(0);
  });

  it('altération d’un octet (nonce) → MediaDecryptError', () => {
    const {enc} = encryptAll(sample(100), key);
    const bad = new Uint8Array(enc);
    bad[HEADER_SIZE + 4] = (bad[HEADER_SIZE + 4]! + 1) % 256;
    expect(() => decryptAll(bad, key)).toThrow(MediaDecryptError);
  });

  it('altération au milieu d’un bloc (2e bloc) → MediaDecryptError', () => {
    const {enc} = encryptAll(sample(3 * BLOCK_SIZE), key);
    const bad = new Uint8Array(enc);
    const pos = HEADER_SIZE + FULL_BLOCK + 1000;
    bad[pos] = (bad[pos]! + 1) % 256;
    expect(() => decryptAll(bad, key)).toThrow(MediaDecryptError);
  });

  it('altération du tag → MediaDecryptError', () => {
    const {enc} = encryptAll(sample(100), key);
    const bad = new Uint8Array(enc);
    bad[bad.length - 1] = (bad[bad.length - 1]! + 1) % 256;
    expect(() => decryptAll(bad, key)).toThrow(MediaDecryptError);
  });

  it('mauvaise clé → MediaDecryptError', () => {
    const {enc} = encryptAll(sample(100), key);
    const other = new Uint8Array(32).fill(9);
    expect(() => decryptAll(enc, other)).toThrow(MediaDecryptError);
  });

  it('troncature en fin de bloc → erreur', () => {
    const {enc} = encryptAll(sample(50), key);
    expect(() => decryptAll(enc.subarray(0, enc.length - 5), key)).toThrow(
      MediaDecryptError,
    );
  });

  it('suppression du dernier bloc (frontière) → erreur', () => {
    const {enc} = encryptAll(sample(3 * BLOCK_SIZE), key);
    const cut = enc.subarray(0, HEADER_SIZE + 2 * FULL_BLOCK);
    expect(() => decryptAll(cut, key)).toThrow(MediaDecryptError);
  });

  it('réordonnancement de blocs → erreur', () => {
    const {enc} = encryptAll(sample(3 * BLOCK_SIZE), key);
    const swapped = new Uint8Array(enc);
    const first = enc.subarray(HEADER_SIZE, HEADER_SIZE + FULL_BLOCK);
    const second = enc.subarray(
      HEADER_SIZE + FULL_BLOCK,
      HEADER_SIZE + 2 * FULL_BLOCK,
    );
    swapped.set(second, HEADER_SIZE);
    swapped.set(first, HEADER_SIZE + FULL_BLOCK);
    expect(() => decryptAll(swapped, key)).toThrow(MediaDecryptError);
  });

  it('en-tête invalide (magic) → erreur', () => {
    const {enc} = encryptAll(sample(10), key);
    const bad = new Uint8Array(enc);
    bad[0] = 0;
    expect(() => decryptAll(bad, key)).toThrow(MediaDecryptError);
  });

  it('dérivation déterministe, longueur 32, dépend du maître', () => {
    const m1 = 'master-key-32chars-minimum!!!!!!';
    const a = deriveMediaFileKeyFromMaster(m1);
    const b = deriveMediaFileKeyFromMaster(m1);
    const c = deriveMediaFileKeyFromMaster('other-master-key-32chars-minimum!');
    expect(Buffer.from(a).toString('hex')).toBe(Buffer.from(b).toString('hex'));
    expect(Buffer.from(a).toString('hex')).not.toBe(
      Buffer.from(c).toString('hex'),
    );
    expect(a.length).toBe(32);
  });
});
