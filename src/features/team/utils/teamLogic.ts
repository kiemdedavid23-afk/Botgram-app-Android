/** Logique pure de l'écran Équipe : règles du Worker appliquées côté app avant tout envoi. */
import type {
  Invite,
  InviteRole,
  TeamMember,
  TeamRole,
  WorkspacePatch,
} from '../../../core/api/endpoints/team';

export const TEAM_MAX = 10;
export const INVITE_VALIDITY_DAYS = 7;
const DAY_MS = 24 * 60 * 60 * 1000;

export function roleName(role: TeamRole): string {
  if (role === 'owner') return 'Propriétaire';
  if (role === 'agent') return 'Agent';
  return 'Lecteur';
}

export function roleExplain(role: InviteRole): string {
  return role === 'agent'
    ? 'Lit les conversations et répond aux clients.'
    : 'Lit les conversations, sans écrire ni modifier.';
}

/** Places restantes : personnes + invitations en attente ≤ 10. */
export function seatsLeft(membersCount: number, pendingInvites: number): number {
  return Math.max(0, TEAM_MAX - Math.max(0, membersCount) - Math.max(0, pendingInvites));
}

/** Invitations réellement en attente (non expirées). */
export function pendingInvites(invites: readonly Invite[], now: number): Invite[] {
  return invites.filter(i => i.status === 'pending' && i.expires_at > now);
}

export function daysLeft(expiresAt: number, now: number): number {
  return Math.max(0, Math.ceil((expiresAt - now) / DAY_MS));
}

export function expiryLabel(expiresAt: number, now: number): string {
  const d = daysLeft(expiresAt, now);
  if (d <= 0) return 'Expirée';
  return d === 1 ? 'Expire dans 1 jour' : `Expire dans ${d} jours`;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export type InviteCheck = {ok: true} | {ok: false; message: string};

export function validateInvite(
  emailRaw: string,
  seats: number,
  pending: readonly Invite[] = [],
): InviteCheck {
  const email = normalizeEmail(emailRaw);
  if (!EMAIL_RE.test(email) || email.length > 254) {
    return {ok: false, message: 'Saisissez une adresse e-mail valide.'};
  }
  // Réinviter une adresse déjà en attente remplace l'ancienne invitation : aucune place en plus.
  const replaces = pending.some(i => normalizeEmail(i.email) === email);
  if (seats <= 0 && !replaces) {
    return {
      ok: false,
      message: `L’équipe est complète (${TEAM_MAX} personnes, invitations en attente comprises).`,
    };
  }
  return {ok: true};
}

export type MemberActions = {
  canChangeRole: boolean;
  canRemove: boolean;
  canTransfer: boolean;
};

/** Actions possibles sur une personne : seul le propriétaire agit, jamais sur lui-même. */
export function memberActions(
  isOwner: boolean,
  target: TeamMember,
  selfId: string | null,
): MemberActions {
  const none = {canChangeRole: false, canRemove: false, canTransfer: false};
  if (!isOwner || target.role === 'owner' || target.member_id === selfId) return none;
  return {canChangeRole: true, canRemove: true, canTransfer: true};
}

/** Propriétaire en tête, puis par ancienneté. */
export function sortMembers(members: readonly TeamMember[]): TeamMember[] {
  return [...members].sort((a, b) => {
    if (a.role === 'owner' && b.role !== 'owner') return -1;
    if (b.role === 'owner' && a.role !== 'owner') return 1;
    return a.joined_at - b.joined_at;
  });
}

/** Texte à partager avec le code (le Worker ne le montre qu'une fois). */
export function shareInviteText(code: string, companyName: string, email: string): string {
  return (
    `Vous êtes invité(e) à rejoindre « ${companyName} » sur Botgram.\n` +
    `Code d’invitation : ${code}\n` +
    `Inscrivez-vous avec l’adresse ${email} en choisissant « Invité ».`
  );
}

export function mailFailureLabel(reason: string | undefined): string {
  if (reason === 'email_quota') return 'Quota d’e-mails atteint : transmettez le code vous-même.';
  return 'L’e-mail n’a pas pu partir : transmettez le code vous-même.';
}

/** Message lisible pour un code d'erreur du Worker. */
export function describeTeamError(
  code: string | undefined,
  details?: unknown,
): string {
  const reason = (details as {reason?: string} | undefined)?.reason;
  switch (code) {
    case 'INVITE_EMAIL_REGISTERED':
      return 'Cette adresse a déjà un compte Botgram : elle ne peut pas être invitée.';
    case 'WORKSPACE_LIMIT_REACHED':
      return `L’équipe est complète (${TEAM_MAX} personnes, invitations en attente comprises).`;
    case 'CONFLICT':
      return reason === 'already_member'
        ? 'Cette personne fait déjà partie de l’entreprise.'
        : 'Action impossible dans l’état actuel de l’équipe.';
    case 'RATE_LIMITED':
    case 'TOO_MANY_REQUESTS':
      return 'Trop d’invitations aujourd’hui (20 par jour). Réessayez demain.';
    case 'FORBIDDEN':
      return reason === 'owner_role'
        ? 'Le rôle du propriétaire ne change que par transfert de propriété.'
        : 'Vous n’avez plus le droit d’effectuer cette action.';
    case 'WORKSPACE_HAS_MEMBERS':
      return 'Transférez d’abord la propriété avant de quitter l’entreprise.';
    case 'NOT_FOUND':
      return 'Introuvable : la liste a changé, elle vient d’être actualisée.';
    case 'EMAIL_NOT_VERIFIED':
      return 'Votre adresse e-mail doit être vérifiée.';
    default:
      return 'Une erreur est survenue. Réessayez dans un instant.';
  }
}

export type PatchCheck =
  | {ok: true; patch: WorkspacePatch}
  | {ok: false; message: string};

export type CompanyDraft = {name: string; country: string; sector: string; phone: string};

/** Même règles que l'inscription : nom 2–80, secteur 2–80, téléphone « + » 8–25 caractères. */
export function buildCompanyPatch(
  draft: CompanyDraft,
  current: {name: string; country: string | null; sector: string | null; phone: string | null},
): PatchCheck {
  const patch: WorkspacePatch = {};
  const name = draft.name.trim();
  if (name.length < 2 || name.length > 80) {
    return {ok: false, message: 'Le nom doit faire entre 2 et 80 caractères.'};
  }
  if (name !== current.name) patch.name = name;

  const sector = draft.sector.trim();
  if (sector) {
    if (sector.length < 2 || sector.length > 80) {
      return {ok: false, message: 'Le secteur doit faire entre 2 et 80 caractères.'};
    }
    if (sector !== (current.sector ?? '')) patch.sector = sector;
  }

  const country = draft.country.trim().toUpperCase();
  if (country) {
    if (!/^[A-Z]{2}$/.test(country)) {
      return {ok: false, message: 'Choisissez un pays dans la liste.'};
    }
    if (country !== (current.country ?? '')) patch.country = country;
  }

  const phone = draft.phone.replace(/\s+/g, '');
  if (phone) {
    if (!/^\+\d{7,24}$/.test(phone)) {
      return {
        ok: false,
        message: 'Le téléphone commence par « + » et compte 8 à 25 caractères.',
      };
    }
    if (phone !== (current.phone ?? '').replace(/\s+/g, '')) patch.phone = phone;
  }
  return {ok: true, patch};
}

export function isEmptyPatch(p: WorkspacePatch): boolean {
  return Object.keys(p).length === 0;
}
