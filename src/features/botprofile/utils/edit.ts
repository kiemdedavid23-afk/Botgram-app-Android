import type {
  BotCommandItem,
  BotProfile,
  LocalizedTexts,
  TextField,
} from '../../../core/api/endpoints/botProfile.types';
import {
  DEFAULT_LANG,
  emptyTexts,
} from '../../../core/api/endpoints/botProfile.types';

export const cmdKey = (scope: string, lang: string) => `${scope}|${lang}`;

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

/** Site : copie TOUS les textes par defaut. */
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

/** Site : retire textes + commandes dont la cle finit par |code. */
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

export type {TextField};
