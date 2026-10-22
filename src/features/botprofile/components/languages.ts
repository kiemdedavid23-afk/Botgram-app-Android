/** Langues proposables — site botprofile/utils/languages.ts */
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';

export const LANGUAGE_OPTIONS: {code: string; label: string}[] = [
  {code: DEFAULT_LANG, label: 'Par défaut'},
  {code: 'fr', label: 'Français'},
  {code: 'en', label: 'English'},
  {code: 'ar', label: 'العربية'},
  {code: 'es', label: 'Español'},
  {code: 'pt', label: 'Português'},
  {code: 'de', label: 'Deutsch'},
  {code: 'it', label: 'Italiano'},
  {code: 'ru', label: 'Русский'},
  {code: 'tr', label: 'Türkçe'},
  {code: 'hi', label: 'हिन्दी'},
  {code: 'id', label: 'Bahasa Indonesia'},
  {code: 'nl', label: 'Nederlands'},
  {code: 'zh', label: '中文'},
  {code: 'ja', label: '日本語'},
  {code: 'ko', label: '한국어'},
  {code: 'sw', label: 'Kiswahili'},
];

export function langLabel(code: string): string {
  return LANGUAGE_OPTIONS.find(l => l.code === code)?.label ?? code;
}
