/**
 * Libellés et formatage profil membre.
 * Source site : features/member/utils/format.ts
 */

const STATUS_LABELS: Record<string, string> = {
  active: 'Actif',
  pending: 'En attente',
  suspended: 'Suspendu',
};

/** Pastille de statut : good | warn | bad (MemberProfilePage.css .mp-chip__dot--*) */
export function statusTone(status: string): 'good' | 'warn' | 'bad' {
  if (status === 'active') return 'good';
  if (status === 'pending') return 'warn';
  return 'bad';
}

export function statusLabel(status: string): string {
  return STATUS_LABELS[status] ?? status;
}

export function usageLabel(usage: string | null): string {
  if (!usage) return '';
  return usage.charAt(0).toUpperCase() + usage.slice(1);
}

/** Codes ISO proposés dans le sélecteur (site format.ts). */
export const COUNTRY_CODES = [
  'BF',
  'CI',
  'ML',
  'SN',
  'NE',
  'TG',
  'BJ',
  'GH',
  'NG',
  'CM',
  'GN',
  'FR',
  'BE',
  'CA',
  'CH',
  'US',
] as const;

const COUNTRY_NAMES_FR: Record<string, string> = {
  BF: 'Burkina Faso',
  CI: "Côte d'Ivoire",
  ML: 'Mali',
  SN: 'Sénégal',
  NE: 'Niger',
  TG: 'Togo',
  BJ: 'Bénin',
  GH: 'Ghana',
  NG: 'Nigéria',
  CM: 'Cameroun',
  GN: 'Guinée',
  FR: 'France',
  BE: 'Belgique',
  CA: 'Canada',
  CH: 'Suisse',
  US: 'États-Unis',
};

function countryName(code: string): string {
  const upper = code.toUpperCase();
  return COUNTRY_NAMES_FR[upper] ?? upper;
}

function countryFlag(code: string): string {
  if (!/^[A-Za-z]{2}$/.test(code)) return '';
  return String.fromCodePoint(
    ...[...code.toUpperCase()].map(c => 127397 + c.charCodeAt(0)),
  );
}

export function countryLabel(code: string | null): string {
  if (!code) return '';
  const flag = countryFlag(code);
  return `${flag ? flag + ' ' : ''}${countryName(code)}`;
}

/** +22670123456 → +226 70 12 34 56 ; +33… format FR. */
export function formatPhone(phone: string | null): string {
  if (!phone) return '';
  const p = phone.replace(/\s+/g, '');
  if (/^\+226\d{8}$/.test(p)) {
    return `+226 ${p.slice(4).replace(/(\d{2})(?=\d)/g, '$1 ')}`;
  }
  if (/^\+33\d{9}$/.test(p)) {
    return `+33 ${p[3]} ${p.slice(4).replace(/(\d{2})(?=\d)/g, '$1 ')}`;
  }
  return phone;
}

/** 1760000000000 → "Octobre 2025" */
export function memberSince(createdAt: number): string {
  const text = new Date(createdAt).toLocaleDateString('fr-FR', {
    month: 'long',
    year: 'numeric',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** Initiale pour avatar héros (1 caractère). */
export function memberInitial(displayName: string | null | undefined): string {
  const n = (displayName ?? '').trim();
  if (!n) return '?';
  return n.charAt(0).toUpperCase();
}

/**
 * Initiales (2 lettres max) — même règle que l'avatar de l'en-tête (Avatar.tsx) :
 * première lettre des deux premiers mots, sinon les deux premières lettres.
 */
export function memberInitials(displayName: string | null | undefined): string {
  const n = (displayName ?? '').trim();
  if (!n) return '?';
  const parts = n.split(/\s+/);
  const first = parts[0] ?? '';
  const second = parts[1] ?? '';
  if (second) {
    return `${first.charAt(0)}${second.charAt(0)}`.toUpperCase();
  }
  return n.slice(0, 2).toUpperCase();
}

const ROLE_LABELS: Record<string, string> = {
  member: 'Membre',
};

/** Libellé du rôle (pastille du héros) ; vide si le rôle est absent. */
export function roleLabel(role: string | null | undefined): string {
  const r = (role ?? '').trim();
  if (!r) return '';
  return ROLE_LABELS[r] ?? r.charAt(0).toUpperCase() + r.slice(1);
}

/** Usage « boutique » → icône boutique sur la ligne Usage. */
export function isShopUsage(usage: string | null | undefined): boolean {
  return (usage ?? '').toLowerCase().includes('boutique');
}
