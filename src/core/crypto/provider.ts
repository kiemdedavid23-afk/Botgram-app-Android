/**
 * Interface crypto minimale (AES-256-GCM + aléatoire + HKDF).
 * Production : quick-crypto (import uniquement ici via quickProvider).
 * Tests : Node crypto branché derrière la même interface.
 */
export type Cipher = {
  update: (data: Uint8Array) => Uint8Array;
  final: () => Uint8Array;
  getAuthTag: () => Uint8Array;
  setAAD: (aad: Uint8Array) => void;
  setAuthTag: (tag: Uint8Array) => void;
};

export type CryptoProvider = {
  randomBytes: (n: number) => Uint8Array;
  createCipheriv: (
    algo: 'aes-256-gcm',
    key: Uint8Array,
    iv: Uint8Array,
  ) => Cipher;
  createDecipheriv: (
    algo: 'aes-256-gcm',
    key: Uint8Array,
    iv: Uint8Array,
  ) => Cipher;
  hkdfSync: (
    ikm: Uint8Array,
    salt: Uint8Array,
    info: Uint8Array,
    length: number,
  ) => Uint8Array;
};

let active: CryptoProvider | null = null;

export function setCryptoProvider(p: CryptoProvider): void {
  active = p;
}

export function getCryptoProvider(): CryptoProvider {
  if (!active) {
    throw new Error('CryptoProvider non initialisé');
  }
  return active;
}
