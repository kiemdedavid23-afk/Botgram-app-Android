import type {FactorCommand} from './types';
import {PROFILE_FLOWS} from './flowsProfile';
import {SETTINGS_FLOWS} from './flowsSettings';

export const FACTOR_COMMANDS: FactorCommand[] = [
  ...PROFILE_FLOWS,
  ...SETTINGS_FLOWS,
];

/** Forme comparable : minuscules, sans accents ni ponctuation, espaces simples. */
export function normalize(raw: string): string {
  return raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[’'`]/g, ' ')
    .replace(/[^a-z0-9 ]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Anciennes formes (/setname…) acceptées en silence, jamais affichées. */
const LEGACY: Record<string, string> = {
  setabouttext: 'setshortdescription',
  setaboutext: 'setshortdescription',
};

/**
 * Trouve une action à partir de ce que l'utilisateur a écrit :
 * identifiant technique, ancienne forme /setname, titre affiché ou mot clé.
 */
export function findCommand(raw: string): FactorCommand | undefined {
  const key = normalize(raw.replace(/^\//, ''));
  if (!key) return undefined;
  const compact = key.replace(/ /g, '');
  const legacy = LEGACY[compact];
  return FACTOR_COMMANDS.find(c => {
    if (c.id === key || c.id === compact || c.id === legacy) return true;
    if (c.id === `set${compact}`) return true;
    if (normalize(c.title) === key) return true;
    return c.keywords.some(k => normalize(k) === key);
  });
}

/** Actions proposées dans le menu (la photo se règle depuis le profil). */
export const MENU_COMMANDS = FACTOR_COMMANDS.filter(c => !c.unsupported);
