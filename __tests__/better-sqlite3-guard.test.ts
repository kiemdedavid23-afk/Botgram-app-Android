import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..');
const PKG = 'better-sqlite3';

function walk(dir: string, out: string[] = []): string[] {
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (name === 'node_modules') continue;
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js)$/.test(name)) out.push(full);
  }
  return out;
}

describe('better-sqlite3 usage guard', () => {
  it('n’est importé que depuis __tests__/', () => {
    const offenders: string[] = [];
    for (const file of walk(path.join(ROOT, 'src'))) {
      const text = fs.readFileSync(file, 'utf8');
      if (text.includes(PKG)) {
        offenders.push(path.relative(ROOT, file));
      }
    }
    // package.json may list it — not under src
    expect(offenders).toEqual([]);
  });

  it('helper de test autorisé sous __tests__/', () => {
    const helper = path.join(__dirname, 'helpers', 'realSqliteDb.ts');
    expect(fs.existsSync(helper)).toBe(true);
    const text = fs.readFileSync(helper, 'utf8');
    expect(text.includes(PKG)).toBe(true);
  });
});
