/**
 * Validation Telegram avant envoi — site utils/diff.ts validate().
 */
import type {
  BotCommandItem,
  BotProfile,
} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';

const COMMAND_RE = /^[a-z0-9_]{1,32}$/;
const MAX_COMMANDS = 100;

function checkCommands(
  key: string,
  list: BotCommandItem[],
  errors: Record<string, string>,
): void {
  if (list.length > MAX_COMMANDS) {
    errors[`cmd:${key}:list`] = texts.errCmdMax;
  }
  const seen = new Set<string>();
  list.forEach((item, index) => {
    if (!COMMAND_RE.test(item.command)) {
      errors[`cmd:${key}:${index}:command`] = texts.errCmdFormat;
    } else if (seen.has(item.command)) {
      errors[`cmd:${key}:${index}:command`] = texts.errCmdDuplicate;
    }
    seen.add(item.command);
    const length = item.description.trim().length;
    if (length < 1 || length > 256) {
      errors[`cmd:${key}:${index}:description`] = texts.errCmdDesc;
    }
  });
}

export function validate(draft: BotProfile): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [lang, entry] of Object.entries(draft.texts)) {
    const isDefault = lang === DEFAULT_LANG;
    if (isDefault && entry.name.trim().length === 0) {
      errors[`text:${lang}:name`] = texts.errNameRequired;
    }
    if (entry.name.length > 64) {
      errors[`text:${lang}:name`] = texts.errNameMax;
    }
    if (entry.description.length > 512) {
      errors[`text:${lang}:description`] = texts.errDescMax;
    }
    if (entry.short_description.length > 120) {
      errors[`text:${lang}:short_description`] = texts.errShortMax;
    }
  }

  for (const [key, list] of Object.entries(draft.commands)) {
    checkCommands(key, list, errors);
  }

  const menu = draft.menu_button;
  if (menu.type === 'web_app') {
    if (!menu.text.trim()) {
      errors['menu:text'] = texts.errMenuText;
    }
    let validUrl = false;
    try {
      validUrl = new URL(menu.url).protocol === 'https:';
    } catch {
      validUrl = false;
    }
    if (!validUrl) {
      errors['menu:url'] = texts.errMenuUrl;
    }
  }

  return errors;
}
