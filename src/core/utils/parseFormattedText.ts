/**
 * parse_mode HTML / MarkdownV2 → segments Text natifs (S6, M8).
 * Aucune WebView. Schémas de lien : http, https, tg uniquement.
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

export function safeHref(url: string | undefined): string | undefined {
  if (!url) return undefined;
  const u = url.trim();
  return isSafeLink(u) ? u : undefined;
}

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
    /* fallback */
  }
  return [{text: stripTagsLoose(raw)}];
}

function stripTagsLoose(s: string): string {
  return s.replace(/<[^>]*>/g, '');
}

function decodeEntities(s: string): string {
  return s
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x([0-9a-fA-F]+);/g, (_, h: string) =>
      String.fromCodePoint(parseInt(h, 16)),
    )
    .replace(/&#(\d+);/g, (_, n: string) =>
      String.fromCodePoint(parseInt(n, 10)),
    );
}

type StyleFrame = Partial<TextSegment>;

function parseHtml(input: string): TextSegment[] {
  const out: TextSegment[] = [];
  const stack: StyleFrame[] = [{}];
  let i = 0;
  while (i < input.length) {
    if (input[i] === '<') {
      const end = input.indexOf('>', i);
      if (end < 0) {
        pushText(out, stack, input.slice(i));
        break;
      }
      const tagRaw = input.slice(i + 1, end);
      i = end + 1;
      const closing = tagRaw.startsWith('/');
      const body = closing ? tagRaw.slice(1) : tagRaw;
      const nameMatch = body.match(/^([a-zA-Z][\w-]*)/);
      const tag = (nameMatch?.[1] ?? '').toLowerCase();
      if (!tag) continue;
      if (closing) {
        if (stack.length > 1) stack.pop();
        continue;
      }
      const next = applyHtmlOpen(stack[stack.length - 1] ?? {}, tag, body);
      stack.push(next);
      continue;
    }
    const nextTag = input.indexOf('<', i);
    const chunk = nextTag < 0 ? input.slice(i) : input.slice(i, nextTag);
    i = nextTag < 0 ? input.length : nextTag;
    pushText(out, stack, chunk);
  }
  return out.length > 0 ? out : [{text: stripTagsLoose(input)}];
}

function applyHtmlOpen(
  base: StyleFrame,
  tag: string,
  body: string,
): StyleFrame {
  const cur = {...base};
  if (tag === 'b' || tag === 'strong') cur.bold = true;
  else if (tag === 'i' || tag === 'em') cur.italic = true;
  else if (tag === 'u') cur.underline = true;
  else if (tag === 's' || tag === 'strike' || tag === 'del') cur.strike = true;
  else if (tag === 'code') cur.code = true;
  else if (tag === 'pre') cur.pre = true;
  else if (tag === 'a') {
    const hm = body.match(/href\s*=\s*["']([^"']+)["']/i);
    const href = safeHref(hm?.[1]);
    if (href) cur.href = href;
    // schéma non sûr : pas de href → texte non cliquable
  }
  // tg-spoiler, tg-emoji, blockquote, span, etc. : aucun style
  return cur;
}

function pushText(
  out: TextSegment[],
  stack: StyleFrame[],
  raw: string,
): void {
  const text = decodeEntities(raw);
  if (!text) return;
  const style = stack[stack.length - 1] ?? {};
  out.push({text, ...style});
}


/** Tokenizer MarkdownV2 en un passage (pas de pré-déséchappement). */
function parseMarkdownV2(input: string): TextSegment[] {
  const out: TextSegment[] = [];
  let i = 0;
  let buf = '';
  const flush = (extra?: StyleFrame) => {
    if (!buf) return;
    out.push({text: buf, ...extra});
    buf = '';
  };
  while (i < input.length) {
    const step = stepMarkdown(input, i, buf, flush, out);
    buf = step.buf;
    i = step.i;
    if (step.done) break;
  }
  flush();
  return out.length > 0 ? out : [{text: input}];
}

type Step = {i: number; buf: string; done?: boolean};

function stepMarkdown(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const ch = input[i]!;
  if (ch === '\\' && i + 1 < input.length) {
    return {i: i + 2, buf: buf + input[i + 1]!};
  }
  if (input.startsWith('```', i)) {
    return takeFence(input, i, buf, flush, out);
  }
  if (ch === '`') return takeCode(input, i, buf, flush, out);
  if (input.startsWith('||', i)) return takeSpoiler(input, i, buf, flush, out);
  if (input.startsWith('__', i)) {
    return takeUnderline(input, i, buf, flush, out);
  }
  if (ch === '*') return takeMarked(input, i, buf, flush, out, '*', 'bold');
  if (ch === '_') return takeMarked(input, i, buf, flush, out, '_', 'italic');
  if (ch === '~') return takeMarked(input, i, buf, flush, out, '~', 'strike');
  if (ch === '[') return takeLink(input, i, buf, flush, out);
  return {i: i + 1, buf: buf + ch};
}

function takeFence(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const end = input.indexOf('```', i + 3);
  if (end < 0) {
    return {i: input.length, buf: buf + input.slice(i), done: true};
  }
  flush();
  out.push({text: input.slice(i + 3, end), pre: true, code: true});
  return {i: end + 3, buf: ''};
}

function takeCode(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const end = input.indexOf('`', i + 1);
  if (end < 0) return {i: i + 1, buf: buf + '`'};
  flush();
  out.push({text: input.slice(i + 1, end), code: true});
  return {i: end + 1, buf: ''};
}

function takeSpoiler(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const end = input.indexOf('||', i + 2);
  if (end < 0) return {i: i + 2, buf: buf + '||'};
  flush();
  out.push({text: input.slice(i + 2, end)});
  return {i: end + 2, buf: ''};
}

function takeUnderline(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const end = input.indexOf('__', i + 2);
  if (end < 0) return {i: i + 2, buf: buf + '__'};
  flush();
  out.push({text: input.slice(i + 2, end), underline: true});
  return {i: end + 2, buf: ''};
}

function takeMarked(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
  mark: string,
  styleKey: 'bold' | 'italic' | 'strike',
): Step {
  const end = findUnescaped(input, mark, i + 1);
  if (end < 0) return {i: i + 1, buf: buf + mark};
  flush();
  out.push({text: unescapeMd(input.slice(i + 1, end)), [styleKey]: true});
  return {i: end + 1, buf: ''};
}

function takeLink(
  input: string,
  i: number,
  buf: string,
  flush: (extra?: StyleFrame) => void,
  out: TextSegment[],
): Step {
  const closeBracket = input.indexOf(']', i + 1);
  if (
    closeBracket > i &&
    input[closeBracket + 1] === '(' &&
    input.indexOf(')', closeBracket + 2) > closeBracket
  ) {
    const closeParen = input.indexOf(')', closeBracket + 2);
    const label = input.slice(i + 1, closeBracket);
    const url = input.slice(closeBracket + 2, closeParen);
    const href = safeHref(url);
    flush();
    out.push(href ? {text: label, href} : {text: label});
    return {i: closeParen + 1, buf: ''};
  }
  return {i: i + 1, buf: buf + '['};
}

function findUnescaped(s: string, mark: string, from: number): number {
  let j = from;
  while (j < s.length) {
    if (s[j] === '\\') {
      j += 2;
      continue;
    }
    if (s[j] === mark) return j;
    j += 1;
  }
  return -1;
}

function unescapeMd(s: string): string {
  return s.replace(/\\(.)/g, '$1');
}
