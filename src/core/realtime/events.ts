/**
 * Événements temps réel normalisés (contrat v1.3.1 §7.6).
 * hello et session.revoked N'ONT PAS de champ id (Worker room.js).
 * message / conversation optionnels (v15.4 vs v15.5).
 * Événements synthétiques : updates, resync (produits par le transport).
 */

/** Résumé de conversation (GET /updates et GET /bots/:id/conversations). */
export type ConversationSummary = {
  id: string;
  bot_id: string;
  chat_type?: string;
  title?: string | null;
  username?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  contact_id?: string | null;
  pinned?: boolean;
  pinned_at?: number | null;
  has_photo?: boolean;
  photo_url?: string | null;
  initials?: string | null;
  last_message_at?: number;
  created_at?: number;
  unread_count?: number;
  last_message_text?: string | null;
};

/** Message (élément de GET /conversations/:id/messages). */
export type MessagePayload = {
  id: string;
  conversation_id: string;
  direction: 'in' | 'out';
  kind: string;
  status?: string;
  text?: string | null;
  parse_mode?: string | null;
};

export type HelloEvent = {
  type: 'hello';
  at: number;
  server_time: number;
  heartbeat_s?: number;
};

export type MessageNewEvent = {
  type: 'message.new';
  id: string;
  at: number;
  bot_id: string;
  conversation_id: string;
  message_id: string;
  direction: 'in' | 'out';
  kind: string;
  status?: string;
  new_conversation?: boolean;
  message?: MessagePayload;
  conversation?: ConversationSummary;
};

export type MessageUpdatedEvent = {
  type: 'message.updated';
  id: string;
  at: number;
  reason: 'edited' | 'deleted' | 'reaction' | 'pinned' | 'retried' | string;
  message_id: string;
  conversation_id: string;
  bot_id: string;
  status?: string;
  direction?: 'in' | 'out';
  message?: MessagePayload;
  conversation?: ConversationSummary;
};

export type ConversationReadEvent = {
  type: 'conversation.read';
  id: string;
  at: number;
  conversation_id: string;
};

export type ConversationChangedEvent = {
  type: 'conversation.changed';
  id: string;
  at: number;
  conversation_id: string;
  reason: 'pinned' | 'removed' | string;
};

export type BotChangedEvent = {
  type: 'bot.changed';
  id: string;
  at: number;
  bot_id: string;
  reason?: string;
};

export type SessionRevokedEvent = {
  type: 'session.revoked';
  at: number;
  reason?: string;
};

/** Synthétique : après chaque GET /updates réussi. */
export type UpdatesEvent = {
  type: 'updates';
  conversations: ConversationSummary[];
  unread: Record<string, number>;
  has_more: boolean;
};

/** Synthétique : à hello (bots+conversations) et has_more (conversations). */
export type ResyncEvent = {
  type: 'resync';
  scopes: Array<'bots' | 'conversations'>;
};

export type RealtimeEvent =
  | HelloEvent
  | MessageNewEvent
  | MessageUpdatedEvent
  | ConversationReadEvent
  | ConversationChangedEvent
  | BotChangedEvent
  | SessionRevokedEvent
  | UpdatesEvent
  | ResyncEvent;

const KNOWN_TYPES = new Set([
  'hello',
  'message.new',
  'message.updated',
  'conversation.read',
  'conversation.changed',
  'bot.changed',
  'session.revoked',
]);

/**
 * Parse un message JSON brut du WebSocket.
 * hello et session.revoked acceptés SANS id (contrat v1.3.1).
 * Autres types : id obligatoire. bot_request.* et inconnus → null.
 */
export function parseRealtimeEvent(raw: unknown): RealtimeEvent | null {
  if (raw === null || typeof raw !== 'object') return null;
  const obj = raw as Record<string, unknown>;
  const type = obj.type;
  if (typeof type !== 'string' || !KNOWN_TYPES.has(type)) return null;
  const at = typeof obj.at === 'number' ? obj.at : 0;

  switch (type) {
    case 'hello': {
      if (typeof obj.server_time !== 'number') return null;
      return {
        type: 'hello',
        at,
        server_time: obj.server_time,
        heartbeat_s:
          typeof obj.heartbeat_s === 'number' ? obj.heartbeat_s : undefined,
      };
    }
    case 'session.revoked': {
      return {
        type: 'session.revoked',
        at,
        reason: typeof obj.reason === 'string' ? obj.reason : undefined,
      };
    }
    case 'message.new': {
      if (
        typeof obj.id !== 'string' ||
        typeof obj.bot_id !== 'string' ||
        typeof obj.conversation_id !== 'string' ||
        typeof obj.message_id !== 'string' ||
        (obj.direction !== 'in' && obj.direction !== 'out') ||
        typeof obj.kind !== 'string'
      ) {
        return null;
      }
      return {
        type: 'message.new',
        id: obj.id,
        at,
        bot_id: obj.bot_id,
        conversation_id: obj.conversation_id,
        message_id: obj.message_id,
        direction: obj.direction,
        kind: obj.kind,
        status: typeof obj.status === 'string' ? obj.status : undefined,
        new_conversation:
          typeof obj.new_conversation === 'boolean'
            ? obj.new_conversation
            : undefined,
        message:
          obj.message !== undefined && typeof obj.message === 'object'
            ? (obj.message as MessagePayload)
            : undefined,
        conversation:
          obj.conversation !== undefined && typeof obj.conversation === 'object'
            ? (obj.conversation as ConversationSummary)
            : undefined,
      };
    }
    case 'message.updated': {
      if (
        typeof obj.id !== 'string' ||
        typeof obj.message_id !== 'string' ||
        typeof obj.conversation_id !== 'string' ||
        typeof obj.bot_id !== 'string' ||
        typeof obj.reason !== 'string'
      ) {
        return null;
      }
      return {
        type: 'message.updated',
        id: obj.id,
        at,
        reason: obj.reason,
        message_id: obj.message_id,
        conversation_id: obj.conversation_id,
        bot_id: obj.bot_id,
        status: typeof obj.status === 'string' ? obj.status : undefined,
        direction:
          obj.direction === 'in' || obj.direction === 'out'
            ? obj.direction
            : undefined,
        message:
          obj.message !== undefined && typeof obj.message === 'object'
            ? (obj.message as MessagePayload)
            : undefined,
        conversation:
          obj.conversation !== undefined && typeof obj.conversation === 'object'
            ? (obj.conversation as ConversationSummary)
            : undefined,
      };
    }
    case 'conversation.read': {
      if (
        typeof obj.id !== 'string' ||
        typeof obj.conversation_id !== 'string'
      ) {
        return null;
      }
      return {
        type: 'conversation.read',
        id: obj.id,
        at,
        conversation_id: obj.conversation_id,
      };
    }
    case 'conversation.changed': {
      if (
        typeof obj.id !== 'string' ||
        typeof obj.conversation_id !== 'string' ||
        typeof obj.reason !== 'string'
      ) {
        return null;
      }
      return {
        type: 'conversation.changed',
        id: obj.id,
        at,
        conversation_id: obj.conversation_id,
        reason: obj.reason,
      };
    }
    case 'bot.changed': {
      if (typeof obj.id !== 'string' || typeof obj.bot_id !== 'string') {
        return null;
      }
      return {
        type: 'bot.changed',
        id: obj.id,
        at,
        bot_id: obj.bot_id,
        reason: typeof obj.reason === 'string' ? obj.reason : undefined,
      };
    }
    default:
      return null;
  }
}

/** Dédoublonnage : uniquement quand id est présent. */
export function eventId(ev: RealtimeEvent): string | undefined {
  if ('id' in ev && typeof (ev as {id?: string}).id === 'string') {
    return (ev as {id: string}).id;
  }
  return undefined;
}
