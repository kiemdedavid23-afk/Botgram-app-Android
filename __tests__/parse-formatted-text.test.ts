import {
  parseFormattedText,
  isSafeLink,
  safeHref,
} from '../src/core/utils/parseFormattedText';

describe('parseFormattedText', () => {
  it('HTML : gras italique lien', () => {
    const segs = parseFormattedText(
      '<b>Bold</b> <i>It</i> <a href="https://ex.com">L</a>',
      'HTML',
    );
    expect(segs.some(s => s.bold && s.text === 'Bold')).toBe(true);
    expect(segs.some(s => s.italic && s.text === 'It')).toBe(true);
    expect(segs.some(s => s.href === 'https://ex.com')).toBe(true);
  });

  it('MarkdownV2 : bold code', () => {
    const segs = parseFormattedText('*Hi* and `code`', 'MarkdownV2');
    expect(segs.some(s => s.bold && s.text === 'Hi')).toBe(true);
    expect(segs.some(s => s.code && s.text === 'code')).toBe(true);
  });

  it('null parse_mode = brut', () => {
    const segs = parseFormattedText('<b>x</b>', null);
    expect(segs[0]?.text).toContain('x');
  });

  it('schéma dangereux neutralisé', () => {
    const bad = ['java', 'script:alert(1)'].join('');
    expect(isSafeLink(bad)).toBe(false);
    expect(safeHref(bad)).toBeUndefined();
    const segs = parseFormattedText(`<a href="${bad}">x</a>`, 'HTML');
    expect(segs.every(s => !s.href)).toBe(true);
    expect(segs.some(s => s.text.includes('x'))).toBe(true);
  });

  it('balise inconnue + fermante ne fuite pas', () => {
    const segs = parseFormattedText(
      '<tg-spoiler>secret</tg-spoiler> fin',
      'HTML',
    );
    const joined = segs.map(s => s.text).join('');
    expect(joined).toContain('secret');
    expect(joined).toContain('fin');
    expect(joined).not.toContain('tg-spoiler');
    expect(joined).not.toContain('/tg-spoiler');
  });

  it('entité numérique hex', () => {
    const segs = parseFormattedText('it&#x27;s', 'HTML');
    expect(segs.map(s => s.text).join('')).toContain("it's");
  });

  it('MarkdownV2 : échappement underscore littéral', () => {
    const segs = parseFormattedText('foo\\_bar\\_baz', 'MarkdownV2');
    const joined = segs.map(s => s.text).join('');
    expect(joined).toBe('foo_bar_baz');
    expect(segs.every(s => !s.italic)).toBe(true);
  });

  it('MarkdownV2 : \\*littéral\\* sans gras', () => {
    const segs = parseFormattedText('\\*littéral\\*', 'MarkdownV2');
    const joined = segs.map(s => s.text).join('');
    expect(joined).toBe('*littéral*');
    expect(segs.every(s => !s.bold)).toBe(true);
  });

  it('MarkdownV2 : marqueur non fermé conservé', () => {
    const segs = parseFormattedText('*ouvert', 'MarkdownV2');
    expect(segs.map(s => s.text).join('')).toBe('*ouvert');
  });

  it('malformé ne lève pas', () => {
    expect(() => parseFormattedText('<b>unterminated', 'HTML')).not.toThrow();
  });
});
