import {
  greetingWord,
  firstName,
  isBotConnected,
  quotaTone,
  quotaPercent,
  memberSince,
  heroSubtitle,
} from '../src/features/dashboard/logic';

describe('greetingWord', () => {
  it.each([
    [4, 'Bonsoir'],
    [5, 'Bonjour'],
    [17, 'Bonjour'],
    [18, 'Bonsoir'],
  ] as const)('heure %i → %s', (h, w) => {
    expect(greetingWord(h)).toBe(w);
  });
});

describe('firstName', () => {
  it('premier mot', () => {
    expect(firstName('Alice Bob')).toBe('Alice');
  });
  it('vide', () => {
    expect(firstName('')).toBe('');
    expect(firstName(null)).toBe('');
  });
});

describe('isBotConnected', () => {
  it.each([
    ['connected', true],
    ['webhook_error', true],
    ['token_invalid', true],
    ['disconnected', false],
    ['pending', false],
  ] as const)('%s → %s', (status, expected) => {
    expect(isBotConnected(status)).toBe(expected);
  });
});

describe('quotaTone / percent', () => {
  it('loading si null', () => {
    expect(quotaTone(null, null)).toBe('loading');
    expect(quotaPercent(null, 165)).toBe(0);
  });
  it('limit=0 → green, pct 0', () => {
    expect(quotaTone(0, 0)).toBe('green');
    expect(quotaPercent(10, 0)).toBe(0);
  });
  it.each([
    [64, 100, 'green'],
    [65, 100, 'orange'],
    [89, 100, 'orange'],
    [90, 100, 'red'],
  ] as const)('used %i / %i → %s', (u, l, tone) => {
    expect(quotaTone(u, l)).toBe(tone);
  });
});

describe('memberSince', () => {
  it('janvier', () => {
    expect(memberSince(new Date(2024, 0, 15).getTime())).toBe('Janvier 2024');
  });
  it('décembre', () => {
    expect(memberSince(new Date(2025, 11, 1).getTime())).toBe('Décembre 2025');
  });
  it('année', () => {
    expect(memberSince(new Date(2026, 9, 20).getTime())).toBe('Octobre 2026');
  });
});

describe('heroSubtitle', () => {
  it('0/1/n', () => {
    expect(heroSubtitle(0)).toBe('zero');
    expect(heroSubtitle(1)).toBe('one');
    expect(heroSubtitle(3)).toBe('many');
  });
});
