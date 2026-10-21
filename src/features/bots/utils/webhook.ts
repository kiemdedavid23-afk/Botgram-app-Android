/**
 * État webhook dérivé du status Worker (site: botsStore.webhookOf / fromApi).
 */
import type {Bot, BotStatus} from '../../../core/api/endpoints/bots';

export type WebhookState = 'ok' | 'error' | 'none';

/** Connecté au sens métier : connected | webhook_error | token_invalid */
export function isBotConnected(status: BotStatus): boolean {
  return (
    status === 'connected' ||
    status === 'webhook_error' ||
    status === 'token_invalid'
  );
}

export function webhookOf(bot: Bot): WebhookState {
  if (bot.status === 'connected') return 'ok';
  if (bot.status === 'webhook_error' || bot.status === 'token_invalid') {
    return 'error';
  }
  return 'none';
}

export function botStatusLabel(status: BotStatus): string {
  switch (status) {
    case 'connected':
      return 'Connecté';
    case 'webhook_error':
      return 'Webhook en erreur';
    case 'token_invalid':
      return 'Jeton invalide';
    case 'pending':
      return 'En attente';
    case 'disconnected':
      return 'Déconnecté';
    default:
      return status;
  }
}

export function webhookLabel(state: WebhookState): string {
  if (state === 'ok') return 'Webhook actif';
  if (state === 'error') return 'Webhook en erreur';
  return 'Webhook inactif';
}

/** Actions disponibles selon l'état (site GestionPage). */
export function botActionsAvailable(bot: Bot): {
  retry: boolean;
  resync: boolean;
  disconnect: boolean;
  delete: boolean;
} {
  const connected = isBotConnected(bot.status);
  return {
    retry: connected && bot.status !== 'connected',
    resync: bot.status === 'connected',
    disconnect: connected,
    delete: !connected,
  };
}
