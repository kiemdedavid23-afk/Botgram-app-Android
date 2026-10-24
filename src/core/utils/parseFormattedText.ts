/**
 * parse_mode HTML / MarkdownV2 → segments Text natifs (S6, M8).
 * Aucune WebView. Schémas de lien limités : http, https, tg.
 */

export type TextSegment = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  code?: boolean;
  pre?: boolean;
  href?: string;
};

const SAFE_SCHEMES = /^(https?|tg):/i;

export function isSafeLink(url: string): boolean {
  return SAFE_SCHEMES.test(url.trim());
}

/** Lien sûr ou undefined (affiché en texte brut). */
export function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const u = url.trim();
  return isSafeLink(u) ? u : undefined;
}

/**
 * Convertit HTML ou MarkdownV2 en segments.
 * Entrée malformée / inconnue → texte brut.
 */
export function parseFormattedText(
  raw: string | null | undefined,
  parseMode: string | null | undefined,
): TextSegment[] {
  if (!raw) return [];
  const mode = (parseMode ?? '').toUpperCase();
  try {
    if (mode === 'HTML') return parseHtml(raw);
    if (mode === 'MARKDOWNV2') return parseMarkdownV2(raw);
  } catch {
    /* fallback brut */
  }
  return [{text: stripTagsLoose(raw)}];
}

function stripTagsLoose(s: string): string {
  return s.replace(/<[^>]+>/g, '');
}

function parseHtml(input: string): TextSegment[] {
  const out: TextSegment[] = [];
  const re =
    /<\/?(b|strong|i|em|u|s|strike|del|code|pre|a|blockquote|span)(\s[^>]*)?>|[^<]+/gi;
  const stack: Array<Partial<TextSegment>> = [{}];
  let m: RegExpExecArray | null;
  while ((m = re.exec(input)) !== null) {
    const tok = m[0];
    if (tok.startsWith('</')) {
      if (stack.length > 1) stack.pop();
      continue;
    }
    if (tok.startsWith('<')) {
      const tag = (m[1] ?? '').toLowerCase();
      const attrs = m[2] ?? '';
      const cur = {...stack[stack.length - 1]};
      if (tag === 'b' || tag === 'strong') cur.bold = true;
      else if (tag === 'i' || tag === 'em') cur.italic = true;
      else if (tag === 'u') cur.underline = true;
      else if (tag === 's' || tag === 'strike' || tag === 'del') cur.strike = true;
      else if (tag === 'code') cur.code = true;
      else if (tag === 'pre') cur.pre = true;
      else if (tag === 'a') {
        const hm = attrs.match(/href\s*=\s*["']([^"']+)["']/i);
        cur.href = safeHref(hm?.[1]);
      }
      // blockquote / span / spoiler → pas de style spécial
      stack.push(cur);
      continue;
    }
    const style = stack[stack.length - 1] ?? {};
    const text = decodeEntities(tok);
    if (text) out.push({text, ...style});
  }
  return out.length > 0 ? out : [{text: stripTagsLoose(input)}];
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function parseMarkdownV2(input: string): TextSegment[] {
  // Déséchapper d'abord les séquences \\X
  let s = input.replace(/\\([_*\x5b\x5d()~`>#+\-=|{}.!\\])/g, '$1');
  const out: TextSegment[] = [];
  // Approche simple : *bold* _italic_ __underline__ ~strike~ `code` [text](url)
  const tokenRe =
    /\*([^*]+)\*|_([^_]+)_|__([^_]+)__|~([^~]+)~|`([^`]+)`|\x5b([^\x5d]+)\x5d\(([^)]+)\)|([^*_~`\x5b]+)/g;
  let m: RegExpExecArray | null;
  while ((m = tokenRe.exec(s)) !== null) {
    if (m[1]) out.push({text: m[1], bold: true});
    else if (m[2]) out.push({text: m[2], italic: true});
    else if (m[3]) out.push({text: m[3], underline: true});
    else if (m[4]) out.push({text: m[4], strike: true});
    else if (m[5]) out.push({text: m[5], code: true});
    else if (m[6]) out.push({text: m[6], href: safeHref(m[7])});
    else if (m[8]) out.push({text: m[8]});
  }
  return out.length > 0 ? out : [{text: s}];
}
