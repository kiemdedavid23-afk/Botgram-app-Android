/**
 * Écritures profil Telegram d'un bot + re-exports lectures.
 * Site : service/api/botProfile.ts (setMy*, deleteMyCommands…).
 */
import {authedHttp, type HttpResult} from '../session';
import type {
  AdminRights,
  BotCommandItem,
  CommandScope,
  MenuButton,
} from './botProfile.types';
import {DEFAULT_LANG, emptyTexts} from './botProfile.types';

export {
  getBotProfile,
  getBotProfileCore,
  getBotLanguages,
  buildBotPhotoSource,
} from './botProfileRead';

function base(botId: string): string {
  return `/bots/${botId}/profile`;
}

function langParam(lang: string): string | undefined {
  if (!lang || lang === DEFAULT_LANG) return undefined;
  return lang;
}

export async function setMyName(
  botId: string,
  name: string,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  const body: {name: string; language_code?: string} = {name};
  const code = languageCode ? langParam(languageCode) : undefined;
  if (code) body.language_code = code;
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
  const code = languageCode ? langParam(languageCode) : undefined;
  if (code) body.language_code = code;
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
  const code = languageCode ? langParam(languageCode) : undefined;
  if (code) body.language_code = code;
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/short-description`,
    body,
  });
}

export async function setMyCommands(
  botId: string,
  commands: BotCommandItem[],
  scope: CommandScope,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  const body: {
    commands: BotCommandItem[];
    scope: {type: CommandScope};
    language_code?: string;
  } = {
    commands: commands.map(item => ({
      command: item.command,
      description: item.description.trim(),
    })),
    scope: {type: scope},
  };
  const code = languageCode ? langParam(languageCode) : undefined;
  if (code) body.language_code = code;
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/commands`,
    body,
  });
}

/** Liste vide = suppression (même route POST). */
export function deleteMyCommands(
  botId: string,
  scope: CommandScope,
  languageCode?: string,
): Promise<HttpResult<{updated: boolean}>> {
  return setMyCommands(botId, [], scope, languageCode);
}

export async function setChatMenuButton(
  botId: string,
  button: MenuButton,
): Promise<HttpResult<{updated: boolean}>> {
  const menu_button =
    button.type === 'web_app'
      ? {type: 'web_app', text: button.text, web_app: {url: button.url}}
      : {type: button.type};
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/menu-button`,
    body: {menu_button},
  });
}

export async function setMyDefaultAdministratorRights(
  botId: string,
  rights: AdminRights,
  forChannels: boolean,
): Promise<HttpResult<{updated: boolean}>> {
  return authedHttp<{updated: boolean}>({
    method: 'POST',
    path: `${base(botId)}/default-admin-rights`,
    body: {rights, for_channels: forChannels},
  });
}

export {emptyTexts};
