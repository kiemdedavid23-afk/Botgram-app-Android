/**
 * Diff brouillon / enregistré — site diff.ts.
 * Types commandes/menu/droits inclus ; L4b n'envoie que les textes.
 */
import type {BotProfile, TextField} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {
  setMyName,
  setMyDescription,
  setMyShortDescription,
} from '../../../core/api/endpoints/botProfile';
import type {HttpResult} from '../../../core/api/session';
import {langLabel} from './languages';
import {TEXT_LABELS} from './labels';

const FIELDS: TextField[] = ['name', 'description', 'short_description'];

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
        commit: (s, d) => {
          const prev = s.texts[lang] ?? {
            name: '',
            description: '',
            short_description: '',
          };
          const next = d.texts[lang] ?? prev;
          return {
            ...s,
            texts: {
              ...s.texts,
              [lang]: {...prev, [field]: next[field]},
            },
          };
        },
      });
    }
  }
  // L4c : commandes, menu, droits, photo — non envoyés ici
  void DEFAULT_LANG;
  return changes;
}

export function hasChanges(saved: BotProfile | null, draft: BotProfile | null): boolean {
  if (!saved || !draft) return false;
  return buildChanges(saved, draft).length > 0;
}
