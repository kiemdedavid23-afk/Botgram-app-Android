/**
 * Helpers d'édition profil bot — site utils/edit.ts
 */
import type {
  AdminRightKey,
  AdminRights,
  BotCommandItem,
  BotProfile,
  CommandScope,
  LocalizedTexts,
  MenuButton,
  TextField,
} from '../../../core/api/endpoints/botProfile.types';
import {
  COMMAND_SCOPES,
  DEFAULT_LANG,
  emptyTexts,
} from '../../../core/api/endpoints/botProfile.types';

export const cmdKey = (scope: string, lang: string): string =>
  `${scope}|${lang}`;

export function parseCmdKey(
  key: string,
): {scope: CommandScope; lang: string} | null {
  const idx = key.indexOf('|');
  if (idx <= 0) return null;
  const scope = key.slice(0, idx) as CommandScope;
  const lang = key.slice(idx + 1);
  if (!COMMAND_SCOPES.includes(scope) || !lang) return null;
  return {scope, lang};
}

export function setTextField(
  draft: BotProfile,
  lang: string,
  field: keyof LocalizedTexts,
  value: string,
): BotProfile {
  const prev = draft.texts[lang] ?? emptyTexts();
  return {
    ...draft,
    texts: {
      ...draft.texts,
      [lang]: {...prev, [field]: value},
    },
  };
}

/** Site : copie TOUS les textes par défaut. */
export function addLanguage(draft: BotProfile, lang: string): BotProfile {
  if (draft.texts[lang]) return draft;
  const base = draft.texts[DEFAULT_LANG] ?? emptyTexts();
  return {
    ...draft,
    texts: {
      ...draft.texts,
      [lang]: {...base},
    },
  };
}

/** Site : retire textes + commandes dont la clé finit par |code. */
export function removeLanguage(draft: BotProfile, lang: string): BotProfile {
  if (lang === DEFAULT_LANG) return draft;
  const texts = {...draft.texts};
  delete texts[lang];
  const commands: Record<string, BotCommandItem[]> = {};
  for (const [key, list] of Object.entries(draft.commands)) {
    if (!key.endsWith(`|${lang}`)) commands[key] = list;
  }
  return {...draft, texts, commands};
}

export function setHasPhoto(draft: BotProfile, hasPhoto: boolean): BotProfile {
  return {...draft, hasPhoto};
}

export function setCommands(
  draft: BotProfile,
  key: string,
  list: BotCommandItem[],
): BotProfile {
  const commands = {...draft.commands};
  if (list.length === 0) delete commands[key];
  else commands[key] = list;
  return {...draft, commands};
}

export function setMenuButton(
  draft: BotProfile,
  menu_button: MenuButton,
): BotProfile {
  return {...draft, menu_button};
}

export function setRight(
  draft: BotProfile,
  target: 'groups' | 'channels',
  key: AdminRightKey,
  value: boolean,
): BotProfile {
  return {
    ...draft,
    admin_rights: {
      ...draft.admin_rights,
      [target]: {...draft.admin_rights[target], [key]: value},
    },
  };
}

export function setRights(
  draft: BotProfile,
  target: 'groups' | 'channels',
  rights: AdminRights,
): BotProfile {
  return {
    ...draft,
    admin_rights: {
      ...draft.admin_rights,
      [target]: rights,
    },
  };
}

export function resolveText(
  profile: BotProfile,
  lang: string,
  field: TextField,
): string {
  return (
    profile.texts[lang]?.[field] ||
    profile.texts[DEFAULT_LANG]?.[field] ||
    ''
  );
}

export type {TextField};

