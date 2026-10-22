/**
 * Profil Telegram d'un bot - routes /bots/:id/profile/* et /photo.
 * Site : service/api/botProfile.ts (lectures completes + sonde parallele).
 */
import {authedHttp, type HttpResult} from '../session';
import {getAccessToken} from '../../storage';
import {env} from '../../config/env';
import type {
  AdminRights,
  BotCommandItem,
  BotProfile,
  LocalizedTexts,
  MenuButton,
  ProfileSeed,
} from './botProfile.types';
import {
  ADMIN_RIGHT_KEYS,
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
const PROBE_PARALLEL = 5;

function base(botId: string): string {
  return `/bots/${botId}/profile`;
}

function withLang(path: string, lang: string): string {
  if (!lang || lang === DEFAULT_LANG) return path;
  return `${path}?language_code=${encodeURIComponent(lang)}`;
}

function sameTexts(a: LocalizedTexts, b: LocalizedTexts): boolean {
  return (
    a.name === b.name &&
    a.description === b.description &&
    a.short_description === b.short_description
  );
}

async function readTexts(
  botId: string,
  lang: string,
): Promise<HttpResult<LocalizedTexts>> {
  const res = await authedHttp<{
    name?: string;
    description?: string;
    short_description?: string;
  }>({method: 'GET', path: withLang(base(botId), lang)});
  if (!res.ok) return res;
  return {
    ok: true,
    data: {
      name: res.data.name ?? '',
      description: res.data.description ?? '',
      short_description: res.data.short_description ?? '',
    },
    status: res.status,
    headers: res.headers,
    requestId: res.requestId,
  };
}

async function readCommands(
  botId: string,
  lang: string,
): Promise<BotCommandItem[]> {
  const res = await authedHttp<{commands?: BotCommandItem[]}>({
    method: 'GET',
    path: withLang(`${base(botId)}/commands`, lang),
  });
  if (!res.ok) return [];
  return (res.data.commands ?? []).map(item => ({
    command: item.command,
    description: item.description,
  }));
}

async function readMenu(botId: string): Promise<MenuButton> {
  const res = await authedHttp<{
    menu_button?: {type?: string; text?: string; web_app?: {url?: string}} | null;
  }>({method: 'GET', path: `${base(botId)}/menu-button`});
  if (!res.ok) return {type: 'default'};
  const menu = res.data.menu_button;
  if (menu?.type === 'web_app') {
    return {
      type: 'web_app',
      text: menu.text ?? '',
      url: menu.web_app?.url ?? '',
    };
  }
  if (menu?.type === 'commands') return {type: 'commands'};
  return {type: 'default'};
}

async function readRights(
  botId: string,
  forChannels: boolean,
): Promise<AdminRights> {
  const path = `${base(botId)}/default-admin-rights?for_channels=${
    forChannels ? 'true' : 'false'
  }`;
  const res = await authedHttp<{rights?: Record<string, boolean> | null}>({
    method: 'GET',
    path,
  });
  const result = emptyRights();
  if (!res.ok) return result;
  for (const key of ADMIN_RIGHT_KEYS) {
    result[key] = res.data.rights?.[key] === true;
  }
  return result;
}

/** Photo : true si GET /photo reussit (binaire) ; 404/erreur -> false. */
async function readHasPhoto(botId: string): Promise<boolean> {
  const src = await buildBotPhotoSource(botId);
  if (!src) return false;
  const res = await authedHttp<unknown>({
    method: 'GET',
    path: `/bots/${botId}/photo`,
    timeoutMs: 8000,
  });
  return res.ok;
}

async function probeLanguages(
  botId: string,
  defaults: LocalizedTexts,
  defaultCommands: BotCommandItem[],
): Promise<{
  texts: Record<string, LocalizedTexts>;
  commands: Record<string, BotCommandItem[]>;
}> {
  const texts: Record<string, LocalizedTexts> = {};
  const commands: Record<string, BotCommandItem[]> = {};
  let stopped = false;

  const probe = async (code: string) => {
    if (stopped) return;
    const found = await readTexts(botId, code);
    if (!found.ok) {
      if (
        found.error.code === 'RATE_LIMITED' ||
        found.error.code === 'TOO_MANY_REQUESTS'
      ) {
        stopped = true;
      }
      return;
    }
    if (sameTexts(found.data, defaults)) return;
    texts[code] = found.data;
    const list = await readCommands(botId, code);
    if (
      list.length > 0 &&
      JSON.stringify(list) !== JSON.stringify(defaultCommands)
    ) {
      commands[`default|${code}`] = list;
    }
  };

  for (let i = 0; i < PROBE_LANGUAGES.length; i += PROBE_PARALLEL) {
    const batch = PROBE_LANGUAGES.slice(i, i + PROBE_PARALLEL);
    await Promise.all(batch.map(probe));
  }
  return {texts, commands};
}

/**
 * Source Image RN avec Authorization - URL Worker uniquement dans core/api.
 */
export async function buildBotPhotoSource(
  botId: string,
): Promise<{uri: string; headers: Record<string, string>} | null> {
  const token = await getAccessToken();
  if (!token) return null;
  return {
    uri: `${env.apiUrl}/bots/${botId}/photo`,
    headers: {Authorization: `Bearer ${token}`},
  };
}

/**
 * Charge le profil complet (textes, commandes, menu, droits, photo, langues).
 * Echec de la lecture des textes par defaut -> HttpResult en erreur.
 */
export async function getBotProfile(
  botId: string,
  seed: ProfileSeed,
): Promise<HttpResult<BotProfile>> {
  const defaultsRes = await readTexts(botId, DEFAULT_LANG);
  if (!defaultsRes.ok) return defaultsRes;

  const defaults = defaultsRes.data;
  const [defaultCommands, menu, groups, channels, hasPhoto] = await Promise.all(
    [
      readCommands(botId, DEFAULT_LANG),
      readMenu(botId),
      readRights(botId, false),
      readRights(botId, true),
      readHasPhoto(botId),
    ],
  );

  const extra = await probeLanguages(botId, defaults, defaultCommands);

  const profile: BotProfile = {
    bot_id: botId,
    hasPhoto,
    texts: {
      [DEFAULT_LANG]: {
        name: defaults.name || seed.name || '',
        description: defaults.description,
        short_description: defaults.short_description,
      },
      ...extra.texts,
    },
    commands: {
      ...(defaultCommands.length > 0
        ? {[`default|${DEFAULT_LANG}`]: defaultCommands}
        : {}),
      ...extra.commands,
    },
    menu_button: menu,
    admin_rights: {groups, channels},
    info: {
      id: seed.telegram_id ?? '',
      username: seed.username ?? '',
    },
    synced_at: Date.now(),
  };

  return {
    ok: true,
    data: profile,
    status: 200,
    headers: new Headers(),
    requestId: null,
  };
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

// re-export emptyTexts for tests if needed
export {emptyTexts};
