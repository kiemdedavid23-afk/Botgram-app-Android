/**
 * Interface archive locale (13.11) — 6bis-c.
 */
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';
import type {
  TombstoneEntity,
  TombstoneReason,
} from './tombstonesRepo';

export type ArchiveOpenResult =
  | {ok: true}
  | {ok: false; reason: 'unreadable' | 'transient' | 'error'; message: string};

export type ArchiveStore = {
  open: () => Promise<ArchiveOpenResult>;
  close: () => Promise<void>;
  isOpen: () => boolean;
  /** Message one-shot après reset d'archive illisible (null si aucun). */
  consumeResetMessage: () => string | null;
  proofInsert: (label: string) => Promise<void>;
  proofCount: () => Promise<number>;
  clearAll: () => Promise<void>;
  migrateFromMmkv: () => Promise<{conversations: number; messages: number}>;
  upsertConversations: (items: ConversationSummary[]) => Promise<void>;
  listConversations: (botId: string) => Promise<ConversationSummary[]>;
  upsertMessages: (items: Message[]) => Promise<void>;
  listMessages: (conversationId: string, limit: number) => Promise<Message[]>;
  tombstone: (
    entityType: TombstoneEntity,
    entityId: string,
    reason: TombstoneReason,
  ) => Promise<void>;
};

let active: ArchiveStore | null = null;

export function getArchiveStore(): ArchiveStore {
  if (!active) {
    throw new Error('ArchiveStore non initialisé');
  }
  return active;
}

export function setArchiveStoreForTests(store: ArchiveStore): void {
  active = store;
}

export function resetArchiveStoreForTests(): void {
  active = null;
}

export function bindArchiveStore(store: ArchiveStore): void {
  active = store;
}
