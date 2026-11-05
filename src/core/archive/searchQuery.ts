/**
 * Recherche messages — logique pure (sans SQL) : découpage de la requête,
 * expression FTS5 sûre, extrait avec mots trouvés en évidence.
 */

export const MAX_SEARCH_TOKENS = 8;
export const MIN_SEARCH_CHARS = 2;
const SNIPPET_BEFORE = 30;
const SNIPPET_LENGTH = 90;

export type SnippetSegment = {text: string; hit: boolean};

/** Minuscule + sans accent, en conservant 1 caractère par caractère d'origine. */
function foldChars(text: string): string {
  return Array.from(text)
    .map(c => c.normalize('NFD').charAt(0).toLowerCase())
    .join('');
}

/** Mots de la requête : lettres/chiffres uniquement (aucun opérateur FTS possible). */
export function parseQuery(raw: string): string[] {
  const parts = foldChars(raw)
    .split(/[^\p{L}\p{N}]+/u)
    .filter(p => p.length > 0);
  return parts.slice(0, MAX_SEARCH_TOKENS);
}

/**
 * Mots pour le repli LIKE : minuscules mais accents conservés (LIKE ne sait pas
 * ignorer les accents ; l'utilisateur doit donc les saisir comme dans le texte).
 */
export function parseQueryKeepAccents(raw: string): string[] {
  return raw
    .toLowerCase()
    .split(/[^\p{L}\p{N}]+/u)
    .filter(p => p.length > 0)
    .slice(0, MAX_SEARCH_TOKENS);
}

export function isSearchable(raw: string): boolean {
  return raw.trim().length >= MIN_SEARCH_CHARS && parseQuery(raw).length > 0;
}

/** `"mot1"* "mot2"*` : tous les mots, préfixe accepté pour chacun. */
export function toMatchExpression(tokens: string[]): string {
  return tokens.map(t => `"${t}"*`).join(' ');
}

/** Échappe % _ \ pour LIKE ... ESCAPE '\'. */
export function toLikePattern(token: string): string {
  return `%${token.replace(/[\\%_]/g, m => `\\${m}`)}%`;
}

function markHits(folded: string, tokens: string[], from: number, to: number) {
  const hit = new Array<boolean>(to - from).fill(false);
  for (const tok of tokens) {
    let idx = folded.indexOf(tok, from);
    while (idx !== -1 && idx < to) {
      for (let i = idx; i < Math.min(idx + tok.length, to); i += 1) {
        hit[i - from] = true;
      }
      idx = folded.indexOf(tok, idx + tok.length);
    }
  }
  return hit;
}

function toSegments(chars: string[], hit: boolean[], from: number): SnippetSegment[] {
  const out: SnippetSegment[] = [];
  hit.forEach((isHit, i) => {
    const ch = chars[from + i] ?? '';
    const last = out[out.length - 1];
    if (last && last.hit === isHit) {
      last.text += ch;
    } else {
      out.push({text: ch, hit: isHit});
    }
  });
  return out;
}

/** Extrait autour du premier mot trouvé, mots en évidence (insensible casse/accents). */
export function buildSnippet(text: string, tokens: string[]): SnippetSegment[] {
  const flat = text.replace(/\s+/g, ' ').trim();
  const chars = Array.from(flat);
  const folded = foldChars(flat);
  let first = -1;
  for (const tok of tokens) {
    const idx = folded.indexOf(tok);
    if (idx !== -1 && (first === -1 || idx < first)) {
      first = idx;
    }
  }
  const from = Math.max(0, first === -1 ? 0 : first - SNIPPET_BEFORE);
  const to = Math.min(chars.length, from + SNIPPET_LENGTH);
  const segments = toSegments(chars, markHits(folded, tokens, from, to), from);
  if (segments.length > 0 && from > 0) {
    segments[0] = {...segments[0]!, text: `…${segments[0]!.text}`};
  }
  if (segments.length > 0 && to < chars.length) {
    const last = segments[segments.length - 1]!;
    segments[segments.length - 1] = {...last, text: `${last.text}…`};
  }
  return segments;
}
