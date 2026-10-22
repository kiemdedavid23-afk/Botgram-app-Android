/**
 * Validation Telegram avant envoi - site diff.ts validate().
 * Messages via texts.ts (R6).
 */
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';

export function validate(draft: BotProfile): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [lang, t] of Object.entries(draft.texts)) {
    const isDefault = lang === DEFAULT_LANG;
    if (isDefault && t.name.trim().length === 0) {
      errors[`text:${lang}:name`] = texts.errNameRequired;
    }
    if (t.name.length > 64) {
      errors[`text:${lang}:name`] = texts.errNameMax;
    }
    if (t.description.length > 512) {
      errors[`text:${lang}:description`] = texts.errDescMax;
    }
    if (t.short_description.length > 120) {
      errors[`text:${lang}:short_description`] = texts.errShortMax;
    }
  }

  const menu = draft.menu_button;
  if (menu.type === 'web_app') {
    if (!menu.text.trim()) errors['menu:text'] = texts.errMenuText;
    let validUrl = false;
    try {
      validUrl = new URL(menu.url).protocol === 'https:';
    } catch {
      validUrl = false;
    }
    if (!validUrl) errors['menu:url'] = texts.errMenuUrl;
  }

  return errors;
}
