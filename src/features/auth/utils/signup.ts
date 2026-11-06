/**
 * Logique pure de l'inscription (aucun écran, aucun réseau) :
 * validation locale, construction de la requête selon le type de compte,
 * traduction des erreurs du Worker.
 */
import type {
  AccountType,
  NeedsProfile,
  VerifyParams,
} from '../../../core/api/endpoints/auth';
import {ACCOUNT_TYPES} from '../../accounts/accountType';
import {COUNTRIES} from '../data/lists';
import {texts} from '../texts';

/** Un code e-mail vaut 6 minutes (expires_in = 360). */
export const CODE_VALIDITY_MS = 6 * 60 * 1000;

export type SignupForm = {
  displayName: string;
  country: string;
  usage: string;
  phone: string;
  organization: string;
  companyName: string;
  companySector: string;
  companyPhone: string;
  inviteCode: string;
};

export const EMPTY_FORM: SignupForm = {
  displayName: '',
  country: 'BF',
  usage: 'boutique',
  phone: '',
  organization: '',
  companyName: '',
  companySector: '',
  companyPhone: '',
  inviteCode: '',
};

export type SignupFailure =
  | {kind: 'fields'; fields: Record<string, string>; message: string}
  | {kind: 'restart'; message: string}
  | {kind: 'general'; message: string};

export function dialOf(country: string): string {
  return COUNTRIES.find(c => c.code === country)?.dial ?? '226';
}

/** Types proposés par le Worker ; tous les trois si la liste manque ou est vide. */
export function offeredAccountTypes(data: NeedsProfile): AccountType[] {
  const known = (data.account_types ?? []).filter(t =>
    ACCOUNT_TYPES.includes(t),
  );
  return known.length > 0 ? known : [...ACCOUNT_TYPES];
}

/** Code d'invitation : majuscules, sans espaces ni tirets (le Worker les ignore aussi). */
export function normalizeInviteCode(raw: string): string {
  return raw.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** Affichage par groupes de 4 : K7QM4XNP -> K7QM-4XNP. */
export function formatInviteCode(raw: string): string {
  const n = normalizeInviteCode(raw).slice(0, 16);
  return n.match(/.{1,4}/g)?.join('-') ?? '';
}

/** Chiffres nationaux : sans lettres, sans espaces, sans 0 de tête. */
export function phoneDigits(input: string): string {
  return input.replace(/\D/g, '').replace(/^0+/, '');
}

/** +<indicatif><chiffres> ; chaîne vide si rien n'est saisi. */
export function buildPhone(dial: string, input: string): string {
  const digits = phoneDigits(input);
  return digits ? `+${dial}${digits}` : '';
}

function phoneLengthOk(dial: string, digits: string): boolean {
  const total = dial.length + digits.length;
  return total >= 7 && total <= 15;
}

/** Contrôles locaux ; clés = noms de champs du Worker, valeurs = motif (required, too_short…). */
export function validateSignup(
  type: AccountType,
  form: SignupForm,
  dial: string,
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!form.displayName.trim()) errors.display_name = 'required';
  const digits = phoneDigits(form.phone);
  if (!digits) errors.phone = 'required';
  else if (!phoneLengthOk(dial, digits)) errors.phone = 'bad_format';

  if (type === 'company') {
    const name = form.companyName.trim();
    if (!name) errors.company_name = 'required';
    else if (name.length < 2) errors.company_name = 'too_short';
    const cp = phoneDigits(form.companyPhone);
    if (cp && !phoneLengthOk(dial, cp)) errors.company_phone = 'bad_format';
  }
  if (type === 'invited' && !normalizeInviteCode(form.inviteCode)) {
    errors.invite_code = 'required';
  }
  return errors;
}

/** Requête finale : uniquement les champs du chemin choisi. */
export function buildVerifyParams(
  type: AccountType,
  email: string,
  code: string,
  form: SignupForm,
  dial: string,
): VerifyParams {
  const params: VerifyParams = {
    email,
    code,
    account_type: type,
    display_name: form.displayName.trim(),
    country: form.country,
    usage: form.usage,
    phone: buildPhone(dial, form.phone),
  };
  if (type === 'personal') {
    const org = form.organization.trim();
    if (org) params.organization = org;
  } else if (type === 'company') {
    params.company_name = form.companyName.trim();
    const sector = form.companySector.trim();
    if (sector) params.company_sector = sector;
    const phone = buildPhone(dial, form.companyPhone);
    if (phone) params.company_phone = phone;
  } else {
    params.invite_code = normalizeInviteCode(form.inviteCode);
  }
  return params;
}

/** Vrai si le code e-mail a dépassé sa durée de vie (inconnu = on laisse le Worker décider). */
export function isCodeStale(codeAt: number | null, now: number): boolean {
  return codeAt !== null && now - codeAt >= CODE_VALIDITY_MS;
}

export function fieldMessage(reason: string): string {
  switch (reason) {
    case 'required':
    case 'too_short':
      return texts.fieldRequired;
    case 'too_long':
      return texts.fieldTooLong;
    case 'bad_format':
      return texts.fieldBadFormat;
    default:
      return texts.invalidValue;
  }
}

export function reasonsToMessages(
  reasons: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(reasons)) out[k] = fieldMessage(String(v));
  return out;
}

/** Traduit une erreur du Worker en action pour l'écran. */
export function describeSignupError(
  code: string,
  message: string,
  details: unknown,
  retryAfter: string | null,
): SignupFailure {
  const d = (details ?? {}) as {
    fields?: Record<string, string>;
    reason?: string;
  };
  switch (code) {
    case 'VALIDATION_ERROR':
      return {
        kind: 'fields',
        fields: reasonsToMessages(d.fields ?? {}),
        message: texts.checkFields,
      };
    case 'INVITE_INVALID':
      return {
        kind: 'fields',
        fields: {invite_code: texts.inviteInvalid},
        message: texts.checkFields,
      };
    case 'CODE_INVALID':
      return {
        kind: 'restart',
        message:
          d.reason === 'too_many_attempts'
            ? texts.tooManyAttempts
            : d.reason === 'expired'
            ? texts.codeExpired
            : texts.codeInvalid,
      };
    case 'COMPANY_NOT_ALLOWED':
      return {kind: 'general', message: texts.companyNotAllowed};
    case 'ACCOUNT_DISABLED':
      return {kind: 'general', message: texts.accountDisabled};
    case 'RATE_LIMITED':
      return {
        kind: 'general',
        message: texts.rateLimited(retryAfter ? `${retryAfter} s` : 'un instant'),
      };
    default:
      return {kind: 'general', message};
  }
}
