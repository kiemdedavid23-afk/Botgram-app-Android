/**
 * 6bis-e — logique pure de la recherche (sans SQL).
 */
import {
  parseQuery,
  parseQueryKeepAccents,
  isSearchable,
  toMatchExpression,
  toLikePattern,
  buildSnippet,
  MAX_SEARCH_TOKENS,
} from '../src/core/archive/searchQuery';

describe('parseQuery', () => {
  it('minuscules, sans accents, mots seuls', () => {
    expect(parseQuery('Café  CRÈME, déjà!')).toEqual(['cafe', 'creme', 'deja']);
  });

  it('retire les opérateurs et la ponctuation FTS', () => {
    expect(parseQuery('"a" OR b* NEAR(c) -d')).toEqual([
      'a',
      'or',
      'b',
      'near',
      'c',
      'd',
    ]);
  });

  it('limite le nombre de mots', () => {
    const many = Array.from({length: 20}, (_, i) => `mot${i}`).join(' ');
    expect(parseQuery(many).length).toBe(MAX_SEARCH_TOKENS);
  });

  it('chaîne sans lettre ni chiffre : aucun mot', () => {
    expect(parseQuery('*** "" -- ()')).toEqual([]);
  });
});

describe('parseQueryKeepAccents (repli LIKE)', () => {
  it('minuscules, accents conservés', () => {
    expect(parseQueryKeepAccents('Café CRÈME')).toEqual(['café', 'crème']);
  });
});

describe('isSearchable', () => {
  it('au moins 2 caractères utiles', () => {
    expect(isSearchable('a')).toBe(false);
    expect(isSearchable('  a ')).toBe(false);
    expect(isSearchable('ab')).toBe(true);
    expect(isSearchable('**')).toBe(false);
  });
});

describe('expressions SQL', () => {
  it('FTS : chaque mot entre guillemets, préfixe', () => {
    expect(toMatchExpression(['bon', 'jour'])).toBe('"bon"* "jour"*');
  });

  it('LIKE : échappe % _ \\', () => {
    expect(toLikePattern('a%b_c\\d')).toBe('%a\\%b\\_c\\\\d%');
  });
});

describe('buildSnippet', () => {
  const join = (segs: {text: string}[]) => segs.map(s => s.text).join('');

  it('met en évidence les mots, insensible casse et accents', () => {
    const segs = buildSnippet('Merci pour la Réponse rapide', ['reponse']);
    expect(join(segs)).toBe('Merci pour la Réponse rapide');
    expect(segs.filter(s => s.hit).map(s => s.text)).toEqual(['Réponse']);
  });

  it('plusieurs mots', () => {
    const segs = buildSnippet('bonjour le monde, bonjour', ['bonjour', 'monde']);
    expect(segs.filter(s => s.hit).map(s => s.text)).toEqual([
      'bonjour',
      'monde',
      'bonjour',
    ]);
  });

  it('texte long : extrait coupé avec … autour du mot', () => {
    const long = `${'a '.repeat(100)}cible${' b'.repeat(100)}`;
    const text = join(buildSnippet(long, ['cible']));
    expect(text.startsWith('…')).toBe(true);
    expect(text.endsWith('…')).toBe(true);
    expect(text).toContain('cible');
    expect(text.length).toBeLessThan(120);
  });

  it('emoji : pas de décalage des positions', () => {
    const segs = buildSnippet('😀😀 salut tout le monde', ['salut']);
    expect(segs.filter(s => s.hit).map(s => s.text)).toEqual(['salut']);
  });

  it('texte vide : aucun segment', () => {
    expect(buildSnippet('', ['x'])).toEqual([]);
  });
});
