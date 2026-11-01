/** Lecture d'une liste de commandes « commande - description », une par ligne. */
import type {BotCommandItem} from '../../core/api/endpoints/botProfile.types';

export const MAX_COMMANDS = 100;
const LINE = /^\/?([^\s\-–—:]+)\s*[-–—:]\s*(.+)$/;
const NAME = /^[a-z0-9_]{1,32}$/;

export type ParsedCommands =
  | {ok: true; items: BotCommandItem[]}
  | {ok: false; error: string};

export function parseCommands(raw: string): ParsedCommands {
  const lines = raw
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length > 0);
  if (lines.length === 0) return {ok: false, error: 'Aucune commande trouvée.'};
  if (lines.length > MAX_COMMANDS) {
    return {ok: false, error: `Maximum ${MAX_COMMANDS} commandes.`};
  }
  const items: BotCommandItem[] = [];
  const seen = new Set<string>();
  for (const line of lines) {
    const m = LINE.exec(line);
    const name = m?.[1]?.toLowerCase() ?? '';
    const desc = m?.[2]?.trim() ?? '';
    if (!m || !NAME.test(name)) {
      return {
        ok: false,
        error: `« ${line} » : nom de 1 à 32 caractères (minuscules, chiffres, _), puis « - » et la description.`,
      };
    }
    if (desc.length < 1 || desc.length > 256) {
      return {ok: false, error: `« ${name} » : description de 1 à 256 caractères.`};
    }
    if (seen.has(name)) return {ok: false, error: `« ${name} » est en double.`};
    seen.add(name);
    items.push({command: name, description: desc});
  }
  return {ok: true, items};
}
