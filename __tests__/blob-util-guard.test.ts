/**
 * Garde R1 / usage restreint react-native-blob-util.
 */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'src');
const ALLOWED = path.normalize(
  path.join(ROOT, 'core', 'storage', 'mediaFiles.ts'),
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
      if (path.normalize(file) !== ALLOWED) {
        offenders.push(path.relative(path.join(ROOT, '..'), file));
      }
    }
    expect(offenders).toEqual([]);
  });

  it('interdit ReactNativeBlobUtil.fetch et ReactNativeBlobUtil.config', () => {
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
});
