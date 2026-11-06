import {
  CODE_VALIDITY_MS,
  EMPTY_FORM,
  buildPhone,
  buildVerifyParams,
  describeSignupError,
  dialOf,
  formatInviteCode,
  isCodeStale,
  normalizeInviteCode,
  offeredAccountTypes,
  phoneDigits,
  validateSignup,
  type SignupForm,
} from '../src/features/auth/utils/signup';
import {texts} from '../src/features/auth/texts';

const form = (over: Partial<SignupForm> = {}): SignupForm => ({
  ...EMPTY_FORM,
  displayName: ' Awa ',
  phone: '70 12 34 56',
  ...over,
});

describe('inscription — codes et téléphones', () => {
  it('normalise le code d’invitation (majuscules, sans espaces ni tirets)', () => {
    expect(normalizeInviteCode(' k7qm-4xnp ')).toBe('K7QM4XNP');
  });

  it('affiche le code par groupes de 4', () => {
    expect(formatInviteCode('k7qm4xnp')).toBe('K7QM-4XNP');
    expect(formatInviteCode('k7q')).toBe('K7Q');
    expect(formatInviteCode('')).toBe('');
  });

  it('téléphone : chiffres seuls, sans 0 de tête', () => {
    expect(phoneDigits('070 12 34 56')).toBe('70123456');
    expect(buildPhone('226', '70 12 34 56')).toBe('+22670123456');
    expect(buildPhone('226', '')).toBe('');
  });

  it('indicatif du pays, 226 par défaut', () => {
    expect(dialOf('FR')).toBe('33');
    expect(dialOf('ZZ')).toBe('226');
  });

  it('le code e-mail périme après 6 minutes', () => {
    expect(isCodeStale(null, 1000)).toBe(false);
    expect(isCodeStale(1000, 1000 + CODE_VALIDITY_MS - 1)).toBe(false);
    expect(isCodeStale(1000, 1000 + CODE_VALIDITY_MS)).toBe(true);
  });
});

describe('inscription — types proposés', () => {
  it('garde les types connus renvoyés par le Worker', () => {
    expect(
      offeredAccountTypes({
        needs_profile: true,
        missing: [],
        account_types: ['company', 'personal'],
      }),
    ).toEqual(['company', 'personal']);
  });

  it('retombe sur les trois types si la liste manque ou est inconnue', () => {
    const all = ['personal', 'company', 'invited'];
    expect(offeredAccountTypes({needs_profile: true, missing: []})).toEqual(all);
    expect(
      offeredAccountTypes({
        needs_profile: true,
        missing: [],
        // @ts-expect-error valeur inconnue volontaire
        account_types: ['alien'],
      }),
    ).toEqual(all);
  });
});

describe('inscription — validation locale', () => {
  it('particulier : nom et téléphone requis', () => {
    expect(validateSignup('personal', form(), '226')).toEqual({});
    expect(
      validateSignup('personal', form({displayName: ' ', phone: ''}), '226'),
    ).toEqual({display_name: 'required', phone: 'required'});
  });

  it('téléphone trop court : format invalide', () => {
    expect(validateSignup('personal', form({phone: '1'}), '1')).toEqual({
      phone: 'bad_format',
    });
  });

  it('entreprise : nom requis (2 caractères au moins)', () => {
    expect(validateSignup('company', form(), '226')).toEqual({
      company_name: 'required',
    });
    expect(
      validateSignup('company', form({companyName: 'A'}), '226'),
    ).toEqual({company_name: 'too_short'});
    expect(
      validateSignup('company', form({companyName: 'AB'}), '226'),
    ).toEqual({});
  });

  it('entreprise : téléphone de l’entreprise facultatif mais contrôlé', () => {
    const f = form({companyName: 'AB', companyPhone: '1'});
    expect(validateSignup('company', f, '1')).toEqual({
      company_phone: 'bad_format',
    });
  });

  it('invité : code d’invitation requis', () => {
    expect(validateSignup('invited', form(), '226')).toEqual({
      invite_code: 'required',
    });
    expect(
      validateSignup('invited', form({inviteCode: 'K7QM-4XNP'}), '226'),
    ).toEqual({});
  });

  it('les champs d’un autre chemin ne sont pas contrôlés', () => {
    expect(validateSignup('personal', form(), '226')).toEqual({});
  });
});

describe('inscription — requête finale', () => {
  it('particulier : organisation seulement si saisie', () => {
    const p = buildVerifyParams('personal', 'a@b.co', '123456', form(), '226');
    expect(p).toEqual({
      email: 'a@b.co',
      code: '123456',
      account_type: 'personal',
      display_name: 'Awa',
      country: 'BF',
      usage: 'boutique',
      phone: '+22670123456',
    });
    const q = buildVerifyParams(
      'personal',
      'a@b.co',
      '123456',
      form({organization: ' Ma boutique '}),
      '226',
    );
    expect(q.organization).toBe('Ma boutique');
  });

  it('entreprise : nom, secteur et téléphone facultatifs', () => {
    const p = buildVerifyParams(
      'company',
      'a@b.co',
      '123456',
      form({companyName: ' Ma société ', companySector: ' Commerce ', companyPhone: '25 00 00 00'}),
      '226',
    );
    expect(p.account_type).toBe('company');
    expect(p.company_name).toBe('Ma société');
    expect(p.company_sector).toBe('Commerce');
    expect(p.company_phone).toBe('+22625000000');
    expect(p.invite_code).toBeUndefined();
    expect(p.organization).toBeUndefined();
  });

  it('entreprise : secteur et téléphone vides non envoyés', () => {
    const p = buildVerifyParams(
      'company',
      'a@b.co',
      '123456',
      form({companyName: 'Ma société'}),
      '226',
    );
    expect('company_sector' in p).toBe(false);
    expect('company_phone' in p).toBe(false);
  });

  it('invité : code normalisé, aucun champ d’entreprise', () => {
    const p = buildVerifyParams(
      'invited',
      'a@b.co',
      '123456',
      form({inviteCode: 'k7qm-4xnp'}),
      '226',
    );
    expect(p.account_type).toBe('invited');
    expect(p.invite_code).toBe('K7QM4XNP');
    expect(p.company_name).toBeUndefined();
    expect(p.organization).toBeUndefined();
  });
});

describe('inscription — erreurs du Worker', () => {
  it('VALIDATION_ERROR : messages par champ', () => {
    const f = describeSignupError(
      'VALIDATION_ERROR',
      'x',
      {fields: {phone: 'bad_format', company_name: 'too_short'}},
      null,
    );
    expect(f).toEqual({
      kind: 'fields',
      fields: {
        phone: texts.fieldBadFormat,
        company_name: texts.fieldRequired,
      },
      message: texts.checkFields,
    });
  });

  it('INVITE_INVALID : message unique sur le champ code', () => {
    expect(describeSignupError('INVITE_INVALID', 'x', undefined, null)).toEqual({
      kind: 'fields',
      fields: {invite_code: texts.inviteInvalid},
      message: texts.checkFields,
    });
  });

  it('CODE_INVALID : il faut un nouveau code', () => {
    expect(
      describeSignupError('CODE_INVALID', 'x', {reason: 'expired'}, null),
    ).toEqual({kind: 'restart', message: texts.codeExpired});
    expect(
      describeSignupError('CODE_INVALID', 'x', {reason: 'too_many_attempts'}, null),
    ).toEqual({kind: 'restart', message: texts.tooManyAttempts});
    expect(describeSignupError('CODE_INVALID', 'x', {}, null).kind).toBe('restart');
  });

  it('autres erreurs : message général', () => {
    expect(describeSignupError('COMPANY_NOT_ALLOWED', 'x', null, null)).toEqual({
      kind: 'general',
      message: texts.companyNotAllowed,
    });
    expect(describeSignupError('ACCOUNT_DISABLED', 'x', null, null)).toEqual({
      kind: 'general',
      message: texts.accountDisabled,
    });
    expect(describeSignupError('RATE_LIMITED', 'x', null, '30')).toEqual({
      kind: 'general',
      message: texts.rateLimited('30 s'),
    });
    expect(describeSignupError('RATE_LIMITED', 'x', null, null)).toEqual({
      kind: 'general',
      message: texts.rateLimited('un instant'),
    });
    expect(describeSignupError('INTERNAL', 'Oups', null, null)).toEqual({
      kind: 'general',
      message: 'Oups',
    });
  });
});
