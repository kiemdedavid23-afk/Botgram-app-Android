/**
 * 32 langues les plus parlées / utiles produit (affichage v1, sans traduction).
 */
export type AppLanguage = {
  code: string;
  name: string;
  nativeName: string;
};

export const APP_LANGUAGES: readonly AppLanguage[] = [
  {code: 'fr', name: 'Français', nativeName: 'Français'},
  {code: 'en', name: 'English', nativeName: 'English'},
  {code: 'zh', name: 'Chinese', nativeName: '中文'},
  {code: 'es', name: 'Spanish', nativeName: 'Español'},
  {code: 'ar', name: 'Arabic', nativeName: 'العربية'},
  {code: 'hi', name: 'Hindi', nativeName: 'हिन्दी'},
  {code: 'pt', name: 'Portuguese', nativeName: 'Português'},
  {code: 'bn', name: 'Bengali', nativeName: 'বাংলা'},
  {code: 'ru', name: 'Russian', nativeName: 'Русский'},
  {code: 'ja', name: 'Japanese', nativeName: '日本語'},
  {code: 'de', name: 'German', nativeName: 'Deutsch'},
  {code: 'ko', name: 'Korean', nativeName: '한국어'},
  {code: 'it', name: 'Italian', nativeName: 'Italiano'},
  {code: 'tr', name: 'Turkish', nativeName: 'Türkçe'},
  {code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt'},
  {code: 'pl', name: 'Polish', nativeName: 'Polski'},
  {code: 'uk', name: 'Ukrainian', nativeName: 'Українська'},
  {code: 'nl', name: 'Dutch', nativeName: 'Nederlands'},
  {code: 'th', name: 'Thai', nativeName: 'ไทย'},
  {code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia'},
  {code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu'},
  {code: 'fa', name: 'Persian', nativeName: 'فارسی'},
  {code: 'ro', name: 'Romanian', nativeName: 'Română'},
  {code: 'el', name: 'Greek', nativeName: 'Ελληνικά'},
  {code: 'cs', name: 'Czech', nativeName: 'Čeština'},
  {code: 'sv', name: 'Swedish', nativeName: 'Svenska'},
  {code: 'hu', name: 'Hungarian', nativeName: 'Magyar'},
  {code: 'fi', name: 'Finnish', nativeName: 'Suomi'},
  {code: 'da', name: 'Danish', nativeName: 'Dansk'},
  {code: 'no', name: 'Norwegian', nativeName: 'Norsk'},
  {code: 'he', name: 'Hebrew', nativeName: 'עברית'},
  {code: 'sw', name: 'Swahili', nativeName: 'Kiswahili'},
] as const;

export function languageLabel(code: string): string {
  const found = APP_LANGUAGES.find(l => l.code === code);
  if (!found) return code;
  return found.nativeName;
}
