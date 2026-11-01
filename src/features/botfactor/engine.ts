/** Moteur Botfactor : interprète un message, avance le flux, envoie à Telegram. */
import {useBotsStore} from '../bots';
import {useBotProfileStore} from '../botprofile';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {FACTOR_COMMANDS, findCommand, normalize} from './commands';
import {runAction} from './run';
import {
  currentBot,
  explainReply,
  helpReply,
  menuActions,
  menuReply,
  myBotsReply,
  promptOf,
  stepReply,
  welcomeReply,
} from './replies';
import {useBotfactorStore} from './store/botfactorStore';
import {texts as T} from './texts';
import type {EngineResult, FactorCommand, FlowData} from './types';

const YES = ['oui', 'confirm', 'confirmer'];
const NEXT = ['continue', 'continuer'];

function nextIndex(c: FactorCommand, from: number, d: FlowData): number {
  for (let i = from; i < c.steps.length; i++) {
    const skip = c.steps[i]?.skipIf;
    if (!skip || !skip(d)) return i;
  }
  return -1;
}

function global(text: string, lower: string): EngineResult | null {
  const st = useBotfactorStore.getState();
  const key = normalize(text);
  if (lower === '/start' || ['start', 'menu', 'retour'].includes(key)) {
    st.endFlow();
    return menuReply();
  }
  if (['mybots', 'mes bots', 'changer de bot'].includes(key)) {
    st.endFlow();
    return myBotsReply();
  }
  if (['help', 'aide'].includes(key)) {
    st.endFlow();
    return helpReply();
  }
  if (text.startsWith('selectbot:')) {
    st.setTarget(text.slice('selectbot:'.length));
    st.endFlow();
    return menuReply();
  }
  if (/^(explain|expliquer)\s+/.test(key)) {
    return explainReply(key.replace(/^(explain|expliquer)\s+/, ''));
  }
  return null;
}

function begin(c: FactorCommand): EngineResult {
  const st = useBotfactorStore.getState();
  st.endFlow();
  if (c.unsupported) {
    return {text: promptOf(c, 0, {}), actions: menuActions()};
  }
  if (!currentBot()) return {text: T.noBots, actions: menuActions()};
  st.startFlow(c.id);
  return stepReply(c, 0, {});
}

async function execute(c: FactorCommand, data: FlowData): Promise<EngineResult> {
  const st = useBotfactorStore.getState();
  const bot = currentBot();
  st.endFlow();
  if (!bot) return {text: T.needBot, actions: menuActions()};
  const res = await runAction(c.id, bot.id, data);
  if (!res.ok) {
    const detail = res.message ? `\n\n${res.message}` : '';
    return {
      text: `❌ ${T.failure}${detail}\n\n${T.failureNote}`,
      actions: menuActions(),
    };
  }
  fireAndForget(
    useBotProfileStore
      .getState()
      .load(bot.id, {name: bot.name, username: bot.username ?? undefined}, true),
  );
  if (c.id === 'setname') fireAndForget(useBotsStore.getState().load(true));
  return {text: T.success, actions: menuActions()};
}

function advance(c: FactorCommand, from: number, data: FlowData): Promise<EngineResult> | EngineResult {
  const idx = nextIndex(c, from + 1, data);
  if (idx < 0) return execute(c, data);
  useBotfactorStore.getState().goToStep(idx, data);
  return stepReply(c, idx, data);
}

function inFlow(c: FactorCommand, text: string, lower: string): Promise<EngineResult> | EngineResult {
  const {stepIndex, data} = useBotfactorStore.getState();
  const step = c.steps[stepIndex];
  if (!step) {
    useBotfactorStore.getState().endFlow();
    return menuReply();
  }
  const again = {text: promptOf(c, stepIndex, data), actions: stepReply(c, stepIndex, data).actions};
  if (step.type === 'info') {
    return NEXT.includes(lower) ? advance(c, stepIndex, data) : again;
  }
  if (step.type === 'choice') {
    const hit = step.choices?.find(
      ch => ch.value === text || ch.label.toLowerCase() === lower,
    );
    return hit ? advance(c, stepIndex, {...data, [step.id]: hit.value}) : again;
  }
  if (step.type === 'text') {
    const value = step.allowEmpty && text === '__empty__' ? '' : text;
    const err = step.validate?.(value) ?? null;
    if (err) return {text: `${err}\n\n${again.text}`, actions: again.actions};
    return advance(c, stepIndex, {...data, [step.id]: value});
  }
  if (YES.includes(lower)) return execute(c, data);
  useBotfactorStore.getState().endFlow();
  return {text: T.cancelled, actions: menuActions()};
}

export async function processInput(raw: string): Promise<EngineResult> {
  const text = raw.trim();
  const lower = text.toLowerCase();
  const g = global(text, lower);
  if (g) return g;
  const {action} = useBotfactorStore.getState();
  const running = action ? FACTOR_COMMANDS.find(c => c.id === action) : undefined;
  if (running) return inFlow(running, text, lower);
  const cmd = findCommand(lower);
  return cmd ? begin(cmd) : {text: T.unknown, actions: menuActions()};
}

/** Envoi depuis l'écran : affiche le message, attend la réponse, la publie. */
export async function sendInput(value: string, label?: string): Promise<void> {
  const st = useBotfactorStore.getState();
  if (st.busy || !value.trim()) return;
  st.push({from: 'me', text: label ?? value.trim()});
  st.setBusy(true);
  try {
    const reply = await processInput(value);
    useBotfactorStore.getState().push({from: 'bot', ...reply});
  } catch {
    useBotfactorStore
      .getState()
      .push({from: 'bot', text: `❌ ${T.failure}\n\n${T.failureNote}`, actions: menuActions()});
  } finally {
    useBotfactorStore.getState().setBusy(false);
  }
}

/** À l'ouverture : message d'accueil, ou démarrage direct d'une action. */
export function openConversation(action: FactorCommand['id'] | null): void {
  const st = useBotfactorStore.getState();
  if (action) {
    const cmd = FACTOR_COMMANDS.find(c => c.id === action);
    if (cmd) {
      st.push({from: 'bot', ...begin(cmd)});
      return;
    }
  }
  if (st.messages.length === 0) st.push({from: 'bot', ...welcomeReply()});
}

