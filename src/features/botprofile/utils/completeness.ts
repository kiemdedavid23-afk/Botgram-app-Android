/**
 * Completude - site diff.ts completeness() : 6 criteres poids egal.
 */
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {cmdKey} from './edit';

export type Completeness = {
  pct: number;
  missing: string[];
};

export function completeness(profile: BotProfile): Completeness {
  const base = profile.texts[DEFAULT_LANG];
  const items = [
    {ok: !!profile.hasPhoto, label: 'une photo'},
    {ok: !!base?.name.trim(), label: 'un nom'},
    {ok: !!base?.description.trim(), label: 'une description'},
    {ok: !!base?.short_description.trim(), label: 'une description courte'},
    {
      ok: (profile.commands[cmdKey('default', DEFAULT_LANG)] ?? []).length > 0,
      label: 'des commandes',
    },
    {ok: profile.menu_button.type !== 'default', label: 'un bouton de menu'},
  ];
  const done = items.filter(item => item.ok).length;
  return {
    pct: Math.round((done / items.length) * 100),
    missing: items.filter(item => !item.ok).map(item => item.label),
  };
}
