/** Firebase Messaging et Notifee ne sont importés que par core/push/pushClient.ts. */
import * as fs from 'fs';
import * as path from 'path';

const ROOT = path.join(__dirname, '..', 'src');
const ALLOWED = path.normalize(path.join(ROOT, 'core', 'push', 'pushClient.ts'));
const FORBIDDEN = ['@react-native-firebase/', '@notifee/react-native'];

function walk(dir: string, out: string[] = []): string[] {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) walk(full, out);
    else if (/\.(ts|tsx|js|jsx)$/.test(name)) out.push(full);
  }
  return out;
}

describe('garde push', () => {
  it('Firebase et Notifee uniquement dans pushClient.ts', () => {
    const offenders = walk(ROOT)
      .filter(f => path.normalize(f) !== ALLOWED)
      .filter(f => {
        const text = fs.readFileSync(f, 'utf8');
        return FORBIDDEN.some(m => text.includes(m));
      })
      .map(f => path.relative(path.join(ROOT, '..'), f));
    expect(offenders).toEqual([]);
  });

  it('aucun jeton ni contenu de notification dans les journaux du module', () => {
    const dir = path.join(ROOT, 'core', 'push');
    const bad = fs
      .readdirSync(dir)
      .filter(n => /console\./.test(fs.readFileSync(path.join(dir, n), 'utf8')));
    expect(bad).toEqual([]);
  });
});
