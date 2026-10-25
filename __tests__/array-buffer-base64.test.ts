import {arrayBufferToBase64} from '../src/core/utils/arrayBufferBase64';

function enc(s: string): string {
  const bytes = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i += 1) bytes[i] = s.charCodeAt(i);
  return arrayBufferToBase64(bytes.buffer);
}

describe('arrayBufferToBase64', () => {
  it('vecteurs RFC 4648', () => {
    expect(enc('')).toBe('');
    expect(enc('f')).toBe('Zg==');
    expect(enc('fo')).toBe('Zm8=');
    expect(enc('foo')).toBe('Zm9v');
    expect(enc('foob')).toBe('Zm9vYg==');
    expect(enc('fooba')).toBe('Zm9vYmE=');
    expect(enc('foobar')).toBe('Zm9vYmFy');
  });

  it('1 Mo sans erreur', () => {
    const buf = new ArrayBuffer(1024 * 1024);
    const out = arrayBufferToBase64(buf);
    expect(out.length).toBeGreaterThan(0);
    expect(out.endsWith('==') || out.endsWith('=') || out.length % 4 === 0).toBe(
      true,
    );
  });
});
