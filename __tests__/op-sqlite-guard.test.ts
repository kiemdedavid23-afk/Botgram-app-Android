import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'src');
const ALLOWED = path.normalize(
  path.join(ROOT, 'core', 'archive', 'opSqliteArchiveStore.ts'),
);

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('op-sqlite usage guard', () => {
  it('n’est importé que depuis opSqliteArchiveStore.ts', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes('@op-engineering/op-sqlite')) continue;
      if (path.normalize(file) !== ALLOWED) {
        offenders.push(path.relative(path.join(ROOT, '..'), file));
      }
    }
    expect(offenders).toEqual([]);
  });
});
