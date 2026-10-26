/**
 * Tests — initiales, libellé de rôle et icône « boutique » du profil membre.
 */
import {
  memberInitials,
  roleLabel,
  isShopUsage,
} from '../src/features/member/utils/format';

describe('memberInitials', () => {
  it('prend la première lettre des deux premiers mots', () => {
    expect(memberInitials('KIEMDE David')).toBe('KD');
    expect(memberInitials('David Kiemde')).toBe('DK');
  });
  it('prend deux lettres pour un seul mot', () => {
    expect(memberInitials('Alice')).toBe('AL');
  });
  it('gère les valeurs vides', () => {
    expect(memberInitials('')).toBe('?');
    expect(memberInitials(null)).toBe('?');
    expect(memberInitials('   ')).toBe('?');
  });
});

describe('roleLabel', () => {
  it('traduit member en Membre', () => {
    expect(roleLabel('member')).toBe('Membre');
  });
  it('met une majuscule aux autres rôles', () => {
    expect(roleLabel('admin')).toBe('Admin');
  });
  it('renvoie vide sans rôle', () => {
    expect(roleLabel(null)).toBe('');
    expect(roleLabel('')).toBe('');
  });
});

describe('isShopUsage', () => {
  it('reconnaît boutique sans tenir compte de la casse', () => {
    expect(isShopUsage('Boutique')).toBe(true);
    expect(isShopUsage('ma boutique en ligne')).toBe(true);
  });
  it('rejette les autres usages', () => {
    expect(isShopUsage('école')).toBe(false);
    expect(isShopUsage(null)).toBe(false);
  });
});
