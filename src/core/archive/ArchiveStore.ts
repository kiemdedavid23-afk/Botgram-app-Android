/**
 * Interface archive locale (13.11) — 6bis-b : schéma + lecture/écriture.
 */
import type {ConversationSummary} from '../realtime/events';
import type {Message} from '../realtime/messageTypes';

export type ArchiveOpenResult =
  | {ok: true}
  | {ok: false; reason: 'no_key' | 'unreadable' | 'error'; message: string};

export type ArchiveStore = {
  /** Ouvre (ou réouvre) la base chiffrée + migrations. */
  open: () => Promise<ArchiveOpenResult>;
  /** Ferme la connexion. */
  close: () => Promise<void>;
  /** true si une connexion est active. */
  isOpen: () => boolean;
  /** Table de preuve 6bis-a (conservée). */
  proofInsert: (label: string) => Promise<void>;
  proofCount: () => Promise<number>;
  /**
   * Efface TOUTES les données archive : tables, fichier DB, clé Keychain (13.5).
   * Les erreurs ne sont pas avalées silencieusement (remontées au caller).
   */
  clearAll: () => Promise<void>;
  /** Migration MMKV → SQL (idempotente). */
  migrateFromMmkv: () => Promise<{conversations: number; messages: number}>;
  /** Upsert conversations (par id). */
  upsertConversations: (items: ConversationSummary[]) => Promise<void>;
  /** Liste locale pour un bot (hors tombstones). */
  listConversations: (botId: string) => Promise<ConversationSummary[]>;
  /** Upsert messages (par id). */
  upsertMessages: (items: Message[]) => Promise<void>;
  /** Fil local d'une conversation (hors tombstones), ordre croissant. */
  listMessages: (conversationId: string, limit: number) => Promise<Message[]>;
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

/** Branche l'implémentation native (boot app). */
export function bindArchiveStore(store: ArchiveStore): void {
  active = store;
}
