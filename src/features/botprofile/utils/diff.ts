/**
 * Diff brouillon / enregistre — site utils/diff.ts
 * Textes + commandes + menu + droits.
 */
import type {
  AdminRights,
  BotCommandItem,
  BotProfile,
  TextField,
} from '../../../core/api/endpoints/botProfile.types';
import {ADMIN_RIGHT_KEYS} from '../../../core/api/endpoints/botProfile.types';
import {
  deleteMyCommands,
  setChatMenuButton,
  setMyCommands,
  setMyDefaultAdministratorRights,
  setMyDescription,
  setMyName,
  setMyShortDescription,
} from '../../../core/api/endpoints/botProfile';
import type {HttpResult} from '../../../core/api/session';
import {langLabel} from './languages';
import {SCOPE_LABELS, TEXT_LABELS} from './labels';
import {parseCmdKey} from './edit';

const FIELDS: TextField[] = ['name', 'description', 'short_description'];
const EMPTY = {name: '', description: '', short_description: ''};

export type Change = {
  id: string;
  label: string;
  run: (botId: string) => Promise<HttpResult<unknown>>;
  commit: (saved: BotProfile, draft: BotProfile) => BotProfile;
};

function sameRights(a: AdminRights, b: AdminRights): boolean {
  return ADMIN_RIGHT_KEYS.every(k => a[k] === b[k]);
}

function sameCommands(
  a: BotCommandItem[] | undefined,
  b: BotCommandItem[] | undefined,
): boolean {
  return JSON.stringify(a ?? []) === JSON.stringify(b ?? []);
}

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
          const gone = !draft.texts[lang] && FIELDS.every(f => !entry[f]);
          if (gone) {
            delete texts[lang];
          }
          return {...s, texts};
        },
      });
    }
  }

  const cmdKeys = new Set([
    ...Object.keys(saved.commands),
    ...Object.keys(draft.commands),
  ]);
  for (const key of cmdKeys) {
    const before = saved.commands[key];
    const after = draft.commands[key] ?? [];
    if (sameCommands(before, after)) continue;
    const parsed = parseCmdKey(key);
    if (!parsed) continue;
    const {scope, lang} = parsed;
    changes.push({
      id: `cmd:${key}`,
      label: `Commandes · ${SCOPE_LABELS[scope]} · ${langLabel(lang)}`,
      run: botId =>
        after.length === 0
          ? deleteMyCommands(botId, scope, lang)
          : setMyCommands(botId, after, scope, lang),
      commit: s => {
        const commands = {...s.commands};
        if (after.length === 0) delete commands[key];
        else commands[key] = after;
        return {...s, commands};
      },
    });
  }

  if (
    JSON.stringify(saved.menu_button) !== JSON.stringify(draft.menu_button)
  ) {
    changes.push({
      id: 'menu',
      label: 'Bouton de menu',
      run: botId => setChatMenuButton(botId, draft.menu_button),
      commit: (s, d) => ({...s, menu_button: d.menu_button}),
    });
  }

  for (const target of ['groups', 'channels'] as const) {
    if (!sameRights(saved.admin_rights[target], draft.admin_rights[target])) {
      changes.push({
        id: `rights:${target}`,
        label: `Droits d'administrateur · ${
          target === 'groups' ? 'groupes' : 'canaux'
        }`,
        run: botId =>
          setMyDefaultAdministratorRights(
            botId,
            draft.admin_rights[target],
            target === 'channels',
          ),
        commit: (s, d) => ({
          ...s,
          admin_rights: {
            ...s.admin_rights,
            [target]: d.admin_rights[target],
          },
        }),
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
