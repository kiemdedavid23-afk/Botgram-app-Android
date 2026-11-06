/**
 * Type de compte (particulier / entreprise / invité) : point d'aiguillage unique
 * pour que chaque type ait son tableau de bord et son profil, tout en partageant
 * la gestion. Le type est fixé à l'inscription et ne change pas.
 */
import type {AccountType, Member} from '../../core/api/endpoints/auth';

export const ACCOUNT_TYPES: readonly AccountType[] = [
  'personal',
  'company',
  'invited',
];

const LABELS: Record<AccountType, string> = {
  personal: 'Particulier',
  company: 'Entreprise',
  invited: 'Invité',
};

const EMOJI: Record<AccountType, string> = {
  personal: '🙋',
  company: '🏢',
  invited: '✉️',
};

/** Un Worker plus ancien ne renvoie pas `account_type` : c'est un particulier. */
export function accountTypeOf(
  member: Pick<Member, 'account_type'> | null | undefined,
): AccountType {
  return member?.account_type ?? 'personal';
}

export function accountTypeLabel(type: AccountType): string {
  return LABELS[type];
}

export function accountTypeEmoji(type: AccountType): string {
  return EMOJI[type];
}
