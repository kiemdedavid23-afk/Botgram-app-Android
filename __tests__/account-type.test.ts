import {
  ACCOUNT_TYPES,
  accountTypeEmoji,
  accountTypeLabel,
  accountTypeOf,
} from '../src/features/accounts/accountType';

describe('type de compte', () => {
  it('un membre sans account_type est un particulier (ancien Worker)', () => {
    expect(accountTypeOf({})).toBe('personal');
    expect(accountTypeOf(null)).toBe('personal');
    expect(accountTypeOf(undefined)).toBe('personal');
  });

  it('renvoie le type du membre', () => {
    expect(accountTypeOf({account_type: 'company'})).toBe('company');
    expect(accountTypeOf({account_type: 'invited'})).toBe('invited');
  });

  it('chaque type a un libellé et un emoji', () => {
    for (const t of ACCOUNT_TYPES) {
      expect(accountTypeLabel(t).length).toBeGreaterThan(0);
      expect(accountTypeEmoji(t).length).toBeGreaterThan(0);
    }
    expect(accountTypeLabel('invited')).toBe('Invité');
  });
});
