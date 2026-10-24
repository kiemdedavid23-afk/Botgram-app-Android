import {getConversation} from '../../../core/api/endpoints/conversations';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {RealtimeEvent} from '../../../core/realtime';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {mergeById} from './merge';

export type ApplyCtx = {
  get: () => {
    botId: string | null;
    items: ConversationSummary[];
    unreadTotal: number;
  };
  set: (
    partial:
      | Partial<{
          items: ConversationSummary[];
          unreadTotal: number;
          nextCursor: string | null;
        }>
      | ((s: {
          items: ConversationSummary[];
          unreadTotal: number;
        }) => Partial<{
          items: ConversationSummary[];
          unreadTotal: number;
        }>),
  ) => void;
  load: (force?: boolean) => Promise<void>;
};

function applyUpdates(ev: Extract<RealtimeEvent, {type: 'updates'}>, ctx: ApplyCtx): void {
  const botId = ctx.get().botId;
  if (!botId) return;
  const relevant = ev.conversations.filter(c => c.bot_id === botId);
  if (relevant.length > 0) {
    ctx.set(s => ({items: mergeById(s.items, relevant)}));
  }
  if (ev.unread[botId] !== undefined) {
    ctx.set({unreadTotal: ev.unread[botId] ?? 0});
  }
}

function applyMessage(
  ev: Extract<RealtimeEvent, {type: 'message.new' | 'message.updated'}>,
  ctx: ApplyCtx,
): void {
  const botId = ctx.get().botId;
  if (!botId || ev.bot_id !== botId) return;
  if (ev.conversation) {
    const prev = ctx.get().items.find(i => i.id === ev.conversation!.id);
    const oldUnread = prev?.unread_count ?? 0;
    const newUnread = ev.conversation.unread_count ?? oldUnread;
    const delta = newUnread - oldUnread;
    ctx.set(s => ({
      items: mergeById(s.items, [ev.conversation!]),
      unreadTotal: Math.max(0, s.unreadTotal + delta),
    }));
    return;
  }
  const cid = ev.conversation_id;
  fireAndForget(
    getConversation(cid).then(res => {
      if (!res.ok || ctx.get().botId !== botId) return;
      const c = res.data.conversation;
      if (c.bot_id !== ctx.get().botId) return;
      ctx.set(s => ({items: mergeById(s.items, [c])}));
    }),
  );
}

function applyRead(
  ev: Extract<RealtimeEvent, {type: 'conversation.read'}>,
  ctx: ApplyCtx,
): void {
  ctx.set(s => {
    const prev = s.items.find(i => i.id === ev.conversation_id);
    const old = prev?.unread_count ?? 0;
    return {
      items: s.items.map(i =>
        i.id === ev.conversation_id ? {...i, unread_count: 0} : i,
      ),
      unreadTotal: Math.max(0, s.unreadTotal - old),
    };
  });
}

function applyChanged(
  ev: Extract<RealtimeEvent, {type: 'conversation.changed'}>,
  ctx: ApplyCtx,
): void {
  const botId = ctx.get().botId;
  if (ev.reason === 'removed') {
    ctx.set(s => {
      const prev = s.items.find(i => i.id === ev.conversation_id);
      const old = prev?.unread_count ?? 0;
      return {
        items: s.items.filter(i => i.id !== ev.conversation_id),
        unreadTotal: Math.max(0, s.unreadTotal - old),
      };
    });
    return;
  }
  if (ev.reason === 'pinned' && botId) {
    fireAndForget(
      getConversation(ev.conversation_id).then(res => {
        if (!res.ok || ctx.get().botId !== botId) return;
        ctx.set(s => ({
          items: mergeById(s.items, [res.data.conversation]),
        }));
      }),
    );
  }
}

function applyBotChanged(
  ev: Extract<RealtimeEvent, {type: 'bot.changed'}>,
  ctx: ApplyCtx,
): void {
  const botId = ctx.get().botId;
  if (ev.bot_id !== botId) return;
  if (ev.reason === 'disconnected' || ev.reason === 'deleted') {
    ctx.set({items: [], nextCursor: null, unreadTotal: 0});
  }
}

/** Dispatcher court — une branche par type d'événement. */
export function applyRealtimeEventToStore(
  ev: RealtimeEvent,
  ctx: ApplyCtx,
): void {
  if (!ctx.get().botId) return;
  switch (ev.type) {
    case 'updates':
      applyUpdates(ev, ctx);
      return;
    case 'message.new':
    case 'message.updated':
      applyMessage(ev, ctx);
      return;
    case 'conversation.read':
      applyRead(ev, ctx);
      return;
    case 'conversation.changed':
      applyChanged(ev, ctx);
      return;
    case 'resync':
      if (ev.scopes.includes('conversations')) {
        fireAndForget(ctx.load(true));
      }
      return;
    case 'bot.changed':
      applyBotChanged(ev, ctx);
      return;
    default:
      return;
  }
}
