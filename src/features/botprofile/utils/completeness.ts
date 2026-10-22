import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';

/** Score 0–100 approximatif identité (L4b). */
export function completeness(profile: BotProfile): number {
  const t = profile.texts[DEFAULT_LANG] ?? {name: '', description: '', short_description: ''};
  let score = 0;
  if (t.name.trim()) score += 35;
  if (t.description.trim()) score += 25;
  if (t.short_description.trim()) score += 20;
  if (profile.hasPhoto) score += 20;
  return Math.min(100, score);
}
