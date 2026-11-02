import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'src');
const ALLOWED = path.normalize(
  path.join(ROOT, 'core', 'archive', 'opSqliteArchiveStore.ts'),
);

const PKG = '@op-engineering/op-sqlite';

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) walk(full, out);
    else if (/\.(ts|tsx)$/.test(name)) out.push(full);
  }
  return out;
}

/** Lignes qui mentionnent le paquet (hors commentaires purement descriptifs sans import). */
function packageLines(text: string): string[] {
  return text.split('\n').filter(line => line.includes(PKG));
}

function isTypeOnlyImport(line: string): boolean {
  const t = line.trim();
  // import type { X } from 'pkg'
  // import type X from 'pkg'
  return /^import\s+type\s+/.test(t) && t.includes(PKG);
}

function isRuntimeImport(line: string): boolean {
  const t = line.trim();
  if (isTypeOnlyImport(t)) return false;
  // import { open } from 'pkg' | import pkg from 'pkg' | require('pkg')
  if (/^import\s+/.test(t) && t.includes(PKG)) return true;
  if (/require\s*\(.*@op-engineering\/op-sqlite/.test(t)) return true;
  return false;
}

describe('op-sqlite usage guard', () => {
  it('import d\'exécution uniquement depuis opSqliteArchiveStore.ts', () => {
    const offenders: string[] = [];
    for (const file of walk(ROOT)) {
      if (path.normalize(file) === ALLOWED) continue;
      const text = fs.readFileSync(file, 'utf8');
      if (!text.includes(PKG)) continue;
      for (const line of packageLines(text)) {
        if (isRuntimeImport(line)) {
          offenders.push(
            path.relative(path.join(ROOT, '..'), file) + ': ' + line.trim(),
          );
        }
      }
    }
    expect(offenders).toEqual([]);
  });

  it('import type hors opSqliteArchiveStore.ts est autorisé ; runtime refuse', () => {
    // Preuve : une ligne type-only n\'est pas runtime
    expect(
      isTypeOnlyImport(
        "import type {DB} from '@op-engineering/op-sqlite';",
      ),
    ).toBe(true);
    expect(
      isRuntimeImport("import type {DB} from '@op-engineering/op-sqlite';"),
    ).toBe(false);
    expect(
      isRuntimeImport("import {open} from '@op-engineering/op-sqlite';"),
    ).toBe(true);
    expect(
      isRuntimeImport(
        "import {open, type DB} from '@op-engineering/op-sqlite';",
      ),
    ).toBe(true);
  });
});
