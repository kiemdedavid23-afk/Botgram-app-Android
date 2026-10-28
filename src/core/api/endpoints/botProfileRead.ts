/**
 * Lectures profil Telegram d'un bot.
 * Site : service/api/botProfile.ts (lectures + sonde).
 * Erreurs de commandes / menu / droits remontent (HttpResult en échec).
 * Photo : pas de téléchargement JSON ici — hasPhoto via Image onLoad/onError.
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
} from './botProfile.types';

/**
 * Les 7 langues les plus parlées (pas d'hébreu ni d'arabe — choix produit).
 * Une requête textes (+ une requête commandes si différent) par langue.
 */
const PROBE_LANGUAGES = ['fr', 'en', 'es', 'pt', 'ru', 'hi', 'zh'];
const PROBE_PARALLEL = 4;

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

/** Propager l'erreur (réserve L4b-1). */
async function readCommands(
  botId: string,
  lang: string,
): Promise<HttpResult<BotCommandItem[]>> {
  const res = await authedHttp<{commands?: BotCommandItem[]}>({
    method: 'GET',
    path: withLang(`${base(botId)}/commands`, lang),
  });
  if (!res.ok) return res;
  return {
    ok: true,
    data: (res.data.commands ?? []).map(item => ({
      command: item.command,
      description: item.description,
    })),
    status: res.status,
    headers: res.headers,
    requestId: res.requestId,
  };
}

/** Propager l'erreur (réserve L4b-1). */
async function readMenu(botId: string): Promise<HttpResult<MenuButton>> {
  const res = await authedHttp<{
    menu_button?: {
      type?: string;
      text?: string;
      web_app?: {url?: string};
    } | null;
  }>({method: 'GET', path: `${base(botId)}/menu-button`});
  if (!res.ok) return res;
  const menu = res.data.menu_button;
  let data: MenuButton = {type: 'default'};
  if (menu?.type === 'web_app') {
    data = {
      type: 'web_app',
      text: menu.text ?? '',
      url: menu.web_app?.url ?? '',
    };
  } else if (menu?.type === 'commands') {
    data = {type: 'commands'};
  }
  return {
    ok: true,
    data,
    status: res.status,
    headers: res.headers,
    requestId: res.requestId,
  };
}

/** Propager l'erreur (réserve L4b-1). */
async function readRights(
  botId: string,
  forChannels: boolean,
): Promise<HttpResult<AdminRights>> {
  const path = `${base(botId)}/default-admin-rights?for_channels=${
    forChannels ? 'true' : 'false'
  }`;
  const res = await authedHttp<{rights?: Record<string, boolean> | null}>({
    method: 'GET',
    path,
  });
  if (!res.ok) return res;
  const result = emptyRights();
  for (const key of ADMIN_RIGHT_KEYS) {
    result[key] = res.data.rights?.[key] === true;
  }
  return {
    ok: true,
    data: result,
    status: res.status,
    headers: res.headers,
    requestId: res.requestId,
  };
}

async function probeLanguages(
  botId: string,
  defaults: LocalizedTexts,
  defaultCommands: BotCommandItem[],
): Promise<{
  texts: Record<string, LocalizedTexts>;
  commands: Record<string, BotCommandItem[]>;
  /** false si au moins une lecture a échoué : la liste peut être incomplète. */
  complete: boolean;
}> {
  let complete = true;
  const texts: Record<string, LocalizedTexts> = {};
  const commands: Record<string, BotCommandItem[]> = {};
  let stopped = false;

  const probe = async (code: string) => {
    if (stopped) return;
    const found = await readTexts(botId, code);
    if (!found.ok) {
      complete = false;
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
    const listRes = await readCommands(botId, code);
    if (!listRes.ok) complete = false;
    const list = listRes.ok ? listRes.data : [];
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
  return {texts, commands, complete};
}

/**
 * Source Image RN avec Authorization — URL Worker uniquement dans core/api.
 * hasPhoto initial = false ; Image onLoad/onError met à jour via setPhotoPresent.
 * `version` (optionnelle) force le rechargement après changement de photo.
 */
export async function buildBotPhotoSource(
  botId: string,
  version?: number,
): Promise<{uri: string; headers: Record<string, string>} | null> {
  const token = await getAccessToken();
  if (!token) return null;
  const suffix = version ? `?v=${version}` : '';
  return {
    uri: `${env.apiUrl}/bots/${botId}/photo${suffix}`,
    headers: {Authorization: `Bearer ${token}`},
  };
}

/**
 * Socle du profil : 2 requêtes seulement (textes par défaut + commandes par défaut).
 * Le menu, les droits par défaut et les autres langues ne sont PAS lus ici :
 * aucun écran ne les affiche à l'ouverture (langues : voir getBotLanguages).
 */
export async function getBotProfileCore(
  botId: string,
  seed: ProfileSeed,
): Promise<HttpResult<BotProfile>> {
  const [defaultsRes, cmdRes] = await Promise.all([
    readTexts(botId, DEFAULT_LANG),
    readCommands(botId, DEFAULT_LANG),
  ]);
  if (!defaultsRes.ok) return defaultsRes;
  if (!cmdRes.ok) return cmdRes;

  const defaults = defaultsRes.data;
  const profile: BotProfile = {
    bot_id: botId,
    hasPhoto: false,
    texts: {
      [DEFAULT_LANG]: {
        name: defaults.name || seed.name || '',
        description: defaults.description,
        short_description: defaults.short_description,
      },
    },
    commands:
      cmdRes.data.length > 0 ? {[`default|${DEFAULT_LANG}`]: cmdRes.data} : {},
    menu_button: {type: 'default'},
    admin_rights: {groups: emptyRights(), channels: emptyRights()},
    info: {id: seed.telegram_id ?? '', username: seed.username ?? ''},
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

/** Autres langues (sonde sur 7 langues) — à la demande, à l'ouverture d'un onglet concerné. */
export async function getBotLanguages(
  botId: string,
  defaults: LocalizedTexts,
  defaultCommands: BotCommandItem[],
): Promise<{
  texts: Record<string, LocalizedTexts>;
  commands: Record<string, BotCommandItem[]>;
  complete: boolean;
}> {
  return probeLanguages(botId, defaults, defaultCommands);
}

/**
 * Charge le profil complet (toutes sondes — gardé pour les usages « tout d'un coup »).
 * Échec textes défaut OU commandes OU menu OU droits → HttpResult en erreur.
 * Photo non lue ici (réserve L4b-2).
 */
export async function getBotProfile(
  botId: string,
  seed: ProfileSeed,
): Promise<HttpResult<BotProfile>> {
  const defaultsRes = await readTexts(botId, DEFAULT_LANG);
  if (!defaultsRes.ok) return defaultsRes;

  const defaults = defaultsRes.data;

  const [cmdRes, menuRes, groupsRes, channelsRes] = await Promise.all([
    readCommands(botId, DEFAULT_LANG),
    readMenu(botId),
    readRights(botId, false),
    readRights(botId, true),
  ]);

  if (!cmdRes.ok) return cmdRes;
  if (!menuRes.ok) return menuRes;
  if (!groupsRes.ok) return groupsRes;
  if (!channelsRes.ok) return channelsRes;

  const defaultCommands = cmdRes.data;
  const menu = menuRes.data;
  const groups = groupsRes.data;
  const channels = channelsRes.data;

  const extra = await probeLanguages(botId, defaults, defaultCommands);

  const profile: BotProfile = {
    bot_id: botId,
    hasPhoto: false,
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
