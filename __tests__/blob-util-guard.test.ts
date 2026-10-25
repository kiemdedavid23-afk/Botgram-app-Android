/**
 * Garde R1 / usage restreint react-native-blob-util + un seul fetch.
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

  it('un seul fetch( hors NetInfo dans src/', () => {
    const hits: string[] = [];
    for (const file of files) {
      const text = fs.readFileSync(file, 'utf8');
      if (file.includes('NetInfo') || file.includes('netinfo')) continue;
      const matches = text.match(/\bfetch\s*\(/g);
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
});
