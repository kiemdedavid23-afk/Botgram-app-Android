import type {
  BotProfile,
  LocalizedTexts,
} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG, emptyTexts} from '../../../core/api/endpoints/botProfile.types';

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

export function addLanguage(draft: BotProfile, lang: string): BotProfile {
  if (draft.texts[lang]) return draft;
  const base = draft.texts[DEFAULT_LANG] ?? emptyTexts();
  return {
    ...draft,
    texts: {
      ...draft.texts,
      [lang]: {...emptyTexts(), name: base.name},
    },
  };
}

export function removeLanguage(draft: BotProfile, lang: string): BotProfile {
  if (lang === DEFAULT_LANG) return draft;
  const next = {...draft.texts};
  delete next[lang];
  return {...draft, texts: next};
}
