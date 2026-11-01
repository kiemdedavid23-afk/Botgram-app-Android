/** Réponses de Botfactor : menu, aide, liste des bots, explications, étapes. */
import {useBotsStore} from '../bots';
import {MENU_COMMANDS, findCommand} from './commands';
import {useBotfactorStore} from './store/botfactorStore';
import {texts as T} from './texts';
import type {EngineResult, FactorCommand, FlowData, QuickReply} from './types';

export function currentBot() {
  const {bots} = useBotsStore.getState();
  const id = useBotfactorStore.getState().targetBotId;
  return bots.find(b => b.id === id) ?? bots.find(b => b.selected) ?? bots[0];
}

export function botLabel(): string {
  const b = currentBot();
  if (!b) return '';
  return b.username ? `${b.name} (@${b.username})` : b.name;
}

export function menuActions(): QuickReply[] {
  return [
    ...MENU_COMMANDS.map(c => ({label: c.menuLabel, value: c.id})),
    {label: T.menuMyBots, value: 'mybots'},
    {label: T.menuHelp, value: 'aide'},
  ];
}

export function menuReply(): EngineResult {
  const who = botLabel();
  return {
    text: `${who ? `${T.targetPrefix}${who}\n\n` : `${T.noTarget}\n\n`}${T.menu}`,
    actions: menuActions(),
  };
}

export function welcomeReply(): EngineResult {
  return {text: T.welcome, actions: menuActions()};
}

export function myBotsReply(): EngineResult {
  const {bots} = useBotsStore.getState();
  if (bots.length === 0) return {text: T.noBots, actions: menuActions()};
  const lines = bots
    .map(
      (b, i) =>
        `${i + 1}. ${b.name || 'Sans nom'}${b.username ? ` (@${b.username})` : ''}`,
    )
    .join('\n');
  return {
    text: `${T.myBots}\n\n${lines}\n\n${T.pickBot}`,
    actions: bots.map(b => ({label: b.name || 'Bot', value: `selectbot:${b.id}`})),
  };
}

export function helpReply(): EngineResult {
  return {
    text: `${T.helpTitle}\n\n${T.help}`,
    actions: [
      {label: T.backToMenu, value: 'retour'},
      {label: `${T.explain} : Nom du bot`, value: 'explain setname'},
      {label: `${T.explain} : Menu des commandes`, value: 'explain setcommands'},
    ],
  };
}

export function explainReply(raw: string): EngineResult {
  const cmd = findCommand(raw);
  if (!cmd) return {text: T.unknownCommand, actions: menuActions()};
  return {
    text: `${cmd.title}\n\n${cmd.longDescription}`,
    actions: [
      {label: T.start, value: cmd.id},
      {label: T.backToMenu, value: 'retour'},
    ],
  };
}

export const promptOf = (c: FactorCommand, i: number, d: FlowData): string => {
  const p = c.steps[i]?.prompt;
  return typeof p === 'function' ? p(d) : p ?? '';
};

function stepActions(c: FactorCommand, i: number): QuickReply[] {
  const step = c.steps[i];
  const cancel = {label: T.cancel, value: 'retour'};
  if (!step) return [cancel];
  if (step.type === 'choice') return [...(step.choices ?? []), cancel];
  if (step.type === 'confirm') {
    return [{label: T.confirm, value: 'oui'}, cancel];
  }
  if (step.type === 'info') {
    return [{label: T.next, value: 'continue'}, {label: T.backToMenu, value: 'retour'}];
  }
  return step.allowEmpty ? [{label: T.empty, value: '__empty__'}, cancel] : [cancel];
}

export function stepReply(c: FactorCommand, i: number, d: FlowData): EngineResult {
  const who = botLabel();
  const prefix = who && i === 0 ? `${T.targetPrefix}${who}\n\n` : '';
  return {text: `${prefix}${promptOf(c, i, d)}`, actions: stepActions(c, i)};
}

