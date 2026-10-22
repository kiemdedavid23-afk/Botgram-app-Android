/**
 * Profil Telegram d'un bot — routes /bots/:id/profile/* et /photo.
 * Site : service/api/botProfile.ts
 */
import {authedHttp, type HttpResult} from '../session';
import {getAccessToken} from '../../storage';
import {env} from '../../config/env';
import type {
  BotProfile,
  LocalizedTexts,
  ProfileSeed,
} from './botProfile.types';
import {
  DEFAULT_LANG,
  emptyRights,
  emptyTexts,
} from './botProfile.types';

const PROBE_LANGUAGES = [
  'fr',
  'en',
  'ar',
  'es',
  'pt',
  'de',
  'it',
  'ru',
  'tr',
  'hi',
  'id',
  'nl',
  'zh',
  'ja',
  'ko',
  'sw',
];

function base(botId: string): string {
  return `/bots/${botId}/profile`;
}

async function readTexts(
  botId: string,
  lang: string,
): Promise<LocalizedTexts> {
  let path = base(botId);
  if (lang && lang !== DEFAULT_LANG) {
    path = `${path}?language_code=${encodeURIComponent(lang)}`;
  }
  const res = await authedHttp<{
    name?: string;
    description?: string;
    short_description?: string;
  }>({method: 'GET', path});
  if (!res.ok) return emptyTexts();
  return {
    name: res.data.name ?? '',
    description: res.data.description ?? '',
    short_description: res.data.short_description ?? '',
  };
}

function sameTexts(a: LocalizedTexts, b: LocalizedTexts): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.short_description === b.short_description
  );
}

/**
 * Source Image RN avec Authorization — URL Worker uniquement dans core/api.
 * 404 / erreur jeton → null (initiale).
 */
export async function buildBotPhotoSource(
  botId: string,
): Promise<{uri: string; headers: Record<string, string>} | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const uri = `${env.apiUrl}/bots/${botId}/photo`;
  return {
    uri,
    headers: {Authorization: `Bearer ${token}`},
  };
}

export async function getBotProfile(
  botId: string,
  seed: ProfileSeed,
): Promise<HttpResult<BotProfile>> {
  const defaults = await readTexts(botId, DEFAULT_LANG);
  const texts: Record<string, LocalizedTexts> = {
    [DEFAULT_LANG]: {
      name: defaults.name || seed.name || '',
      description: defaults.description,
      short_description: defaults.short_description,
    },
  };

  // Sonde langues (séquentiel léger, parallélisme limité)
  for (const lang of PROBE_LANGUAGES) {
    const t = await readTexts(botId, lang);
    if (!sameTexts(t, defaults) && (t.name || t.description || t.short_description)) {
      texts[lang] = t;
    }
  }

  // Photo : source auth dans buildBotPhotoSource ; 404 → initiale (Image onError)
  const profile: BotProfile = {
    bot_id: botId,
    hasPhoto: true,
    texts,
    commands: {},
    menu_button: {type: 'default'},
    admin_rights: {groups: emptyRights(), channels: emptyRights()},
    info: {
      id: seed.telegram_id ?? botId,
      username: seed.username ?? '',
    },
    synced_at: Date.now(),
  };
  return {ok: true, data: profile, status: 200, headers: new Headers(), requestId: null};
}

export async function setMyName(
  botId: string,
  name: string,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  const body: {name: string; language_code?: string} = {name};
  if (languageCode && languageCode !== DEFAULT_LANG) {
    body.language_code = languageCode;
  }
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/name`,
    body,
  });
}

export async function setMyDescription(
  botId: string,
  description: string,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  const body: {description: string; language_code?: string} = {description};
  if (languageCode && languageCode !== DEFAULT_LANG) {
    body.language_code = languageCode;
  }
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/description`,
    body,
  });
}

export async function setMyShortDescription(
  botId: string,
  short_description: string,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  const body: {short_description: string; language_code?: string} = {
    short_description,
  };
  if (languageCode && languageCode !== DEFAULT_LANG) {
    body.language_code = languageCode;
  }
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/short-description`,
    body,
  });
}
