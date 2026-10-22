/**
 * Diff brouillon / enregistre - site diff.ts.
 * Types commandes/menu/droits inclus ; L4b n'envoie que les textes.
 */
import type {
  BotProfile,
  TextField,
} from '../../../core/api/endpoints/botProfile.types';
import {
  setMyName,
  setMyDescription,
  setMyShortDescription,
} from '../../../core/api/endpoints/botProfile';
import type {HttpResult} from '../../../core/api/session';
import {langLabel} from './languages';
import {TEXT_LABELS} from './labels';

const FIELDS: TextField[] = ['name', 'description', 'short_description'];
const EMPTY = {name: '', description: '', short_description: ''};

export type Change = {
  id: string;
  label: string;
  run: (botId: string) => Promise<HttpResult<unknown>>;
  commit: (saved: BotProfile, draft: BotProfile) => BotProfile;
};

export function buildChanges(saved: BotProfile, draft: BotProfile): Change[] {
  const changes: Change[] = [];
  const langs = new Set([
    ...Object.keys(saved.texts),
    ...Object.keys(draft.texts),
  ]);

  for (const lang of langs) {
    for (const field of FIELDS) {
      const before = saved.texts[lang]?.[field] ?? '';
      const after = draft.texts[lang]?.[field] ?? '';
      if (before === after) continue;
      changes.push({
        id: `text:${lang}:${field}`,
        label: `${TEXT_LABELS[field]} · ${langLabel(lang)}`,
        run: botId => {
          if (field === 'name') return setMyName(botId, after, lang);
          if (field === 'description') {
            return setMyDescription(botId, after, lang);
          }
          return setMyShortDescription(botId, after, lang);
        },
        commit: s => {
          const entry = {...EMPTY, ...s.texts[lang], [field]: after};
          const texts = {...s.texts, [lang]: entry};
          const gone =
            !draft.texts[lang] && FIELDS.every(f => !entry[f]);
          if (gone) {
            delete texts[lang];
          }
          return {...s, texts};
        },
      });
    }
  }

  return changes;
}

export function hasChanges(
  saved: BotProfile | null,
  draft: BotProfile | null,
): boolean {
  if (!saved || !draft) return false;
  return buildChanges(saved, draft).length > 0;
}

export {validate} from './validate';
export {completeness} from './completeness';
