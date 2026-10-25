/**
 * Garde R1 / usage restreint react-native-blob-util + un seul fetch global.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'src');
const ALLOWED_BLOB = path.normalize(
  path.join(ROOT, 'core', 'storage', 'mediaFiles.ts'),
);
const ALLOWED_FETCH = path.normalize(
  path.join(ROOT, 'core', 'api', 'http.ts'),
);

/** Formes de fetch global interdites hors http.ts. */
const FORBIDDEN_FETCH =
  /(?:(?<![.\w])fetch\s*\(|globalThis\.fetch\s*\(|global\.fetch\s*\(|window\.fetch\s*\()/g;

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('react-native-blob-util usage guard', () => {
  const files = walk(ROOT);

  it('n’est importé que depuis mediaFiles.ts', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes('react-native-blob-util')) continue;
      if (path.normalize(file) !== ALLOWED_BLOB) {
        offenders.push(path.relative(path.join(ROOT, '..'), file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('interdit ReactNativeBlobUtil.fetch et .config', () => {
    const offenders: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (
        text.includes('ReactNativeBlobUtil.fetch') ||
        text.includes('ReactNativeBlobUtil.config')
      ) {
        offenders.push(path.relative(path.join(ROOT, '..'), file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('un seul fetch global hors NetInfo dans src/', () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      const matches = text.match(FORBIDDEN_FETCH);
      if (!matches) continue;
      if (path.normalize(file) !== ALLOWED_FETCH) {
        hits.push(
          path.relative(path.join(ROOT, '..'), file) + `:${matches.length}`,
        );
      } else if (matches.length !== 1) {
        hits.push(`http.ts has ${matches.length} fetch(`);
      }
    }
    expect(hits).toEqual([]);
  });

  it('détecte globalThis.fetch, global.fetch, window.fetch', () => {
    const samples = [
      'globalThis.fetch(url)',
      'global.fetch(url)',
      'window.fetch(url)',
      'fetch(url)',
    ];
    for (const s of samples) {
      expect(s.match(FORBIDDEN_FETCH)).not.toBeNull();
    }
    // NetInfo reste autorisé
    expect('NetInfo.fetch()'.match(FORBIDDEN_FETCH)).toBeNull();
    expect('net.fetch()'.match(FORBIDDEN_FETCH)).toBeNull();
  });
});
