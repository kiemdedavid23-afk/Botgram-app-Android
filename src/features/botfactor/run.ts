/** Exécution réelle d'une modification de profil (attend la réponse de Telegram). */
import {
  setMyName,
  setMyDescription,
  setMyShortDescription,
  setMyCommands,
  setChatMenuButton,
  setMyDefaultAdministratorRights,
} from '../../core/api/endpoints/botProfile';
import type {HttpResult} from '../../core/api/session';
import {
  ADMIN_RIGHT_KEYS,
  emptyRights,
  type MenuButton,
} from '../../core/api/endpoints/botProfile.types';
import {parseCommands} from './parseCommands';
import type {FactorAction, FlowData} from './types';

export type RunResult = {ok: true} | {ok: false; message: string};

type Sent = Promise<HttpResult<{updated: boolean}>>;

function menuFrom(d: FlowData): MenuButton {
  if (d.type === 'web_app') {
    return {type: 'web_app', text: (d.wtext ?? '').trim(), url: (d.wurl ?? '').trim()};
  }
  return d.type === 'commands' ? {type: 'commands'} : {type: 'default'};
}

function rightsFrom(d: FlowData) {
  const rights = emptyRights();
  if (d.mode === 'all') for (const k of ADMIN_RIGHT_KEYS) rights[k] = true;
  return rights;
}

function send(action: FactorAction, botId: string, d: FlowData): Sent | null {
  switch (action) {
    case 'setname':
      return setMyName(botId, (d.name ?? '').trim());
    case 'setdescription':
      return setMyDescription(botId, d.description ?? '');
    case 'setshortdescription':
      return setMyShortDescription(botId, d.short ?? '');
    case 'setcommands': {
      const parsed = parseCommands(d.list ?? '');
      return parsed.ok ? setMyCommands(botId, parsed.items, 'default') : null;
    }
    case 'setmenubutton':
      return setChatMenuButton(botId, menuFrom(d));
    case 'setrights':
      return setMyDefaultAdministratorRights(
        botId,
        rightsFrom(d),
        d.target === 'channels',
      );
    default:
      return null;
  }
}

export async function runAction(
  action: FactorAction,
  botId: string,
  data: FlowData,
): Promise<RunResult> {
  const pending = send(action, botId, data);
  if (!pending) return {ok: false, message: ''};
  const res = await pending;
  if (res.ok) return {ok: true};
  const raw = (res.error as {message?: unknown}).message;
  return {ok: false, message: typeof raw === 'string' ? raw : ''};
}
