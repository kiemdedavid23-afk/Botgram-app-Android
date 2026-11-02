/**
 * Schéma archive locale 6bis-b (13.11).
 * FTS5 reporté à 6bis-e : text reste colonne simple.
 * Suppressions = table tombstones uniquement (pas de tombstone_at sur conversations).
 */

export const ARCHIVE_DB_NAME = 'botgram_archive.db';

/** Version courante du schéma (après migrations). */
export const SCHEMA_VERSION = 1;

export const SQL_SCHEMA_VERSION = `
CREATE TABLE IF NOT EXISTS schema_version (
  version INTEGER NOT NULL PRIMARY KEY
);
`;

export const SQL_CONVERSATIONS = `
CREATE TABLE IF NOT EXISTS conversations (
  id TEXT NOT NULL PRIMARY KEY,
  bot_id TEXT NOT NULL,
  chat_type TEXT,
  title TEXT,
  username TEXT,
  first_name TEXT,
  last_name TEXT,
  contact_id TEXT,
  pinned INTEGER NOT NULL DEFAULT 0,
  pinned_at INTEGER,
  has_photo INTEGER NOT NULL DEFAULT 0,
  photo_url TEXT,
  initials TEXT,
  last_message_at INTEGER,
  created_at INTEGER,
  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_text TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_conversations_bot_last
  ON conversations (bot_id, pinned DESC, last_message_at DESC);
`;

export const SQL_MESSAGES = `
CREATE TABLE IF NOT EXISTS messages (
  id TEXT NOT NULL PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  direction TEXT NOT NULL,
  kind TEXT NOT NULL,
  status TEXT,
  text TEXT,
  parse_mode TEXT,
  buttons_json TEXT,
  callback_json TEXT,
  attachment_json TEXT,
  contact_json TEXT,
  location_json TEXT,
  created_at INTEGER,
  sent_at INTEGER,
  edited_at INTEGER,
  telegram_message_id INTEGER,
  error_code TEXT,
  retryable INTEGER,
  retry_at INTEGER,
  client_message_id TEXT,
  updated_at INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_messages_conv_created
  ON messages (conversation_id, created_at ASC);
`;

export const SQL_ALBUM_ITEMS = `
CREATE TABLE IF NOT EXISTS album_items (
  id TEXT NOT NULL PRIMARY KEY,
  album_message_id TEXT NOT NULL,
  kind TEXT,
  text TEXT,
  telegram_message_id INTEGER,
  attachment_json TEXT,
  created_at INTEGER,
  expires_at INTEGER
);
CREATE INDEX IF NOT EXISTS idx_album_items_parent
  ON album_items (album_message_id);
`;

/**
 * Seul mécanisme de suppressions locales (décision 6bis).
 * entity_type: 'conversation' | 'message'
 * reason: 'user_deleted' | 'server_removed' | autre documenté plus tard
 * server_deleted n'est PAS une colonne métier : l'absence serveur ne
 * supprime jamais (13.11). Une entrée ici est la seule preuve de retrait local.
 */
export const SQL_TOMBSTONES = `
CREATE TABLE IF NOT EXISTS tombstones (
  entity_type TEXT NOT NULL,
  entity_id TEXT NOT NULL,
  tombstoned_at INTEGER NOT NULL,
  reason TEXT,
  PRIMARY KEY (entity_type, entity_id)
);
`;

/** Migration v1 : tables métier (archive_proof peut rester pour preuves). */
export const MIGRATION_V1: string[] = [
  SQL_SCHEMA_VERSION,
  SQL_CONVERSATIONS,
  SQL_MESSAGES,
  SQL_ALBUM_ITEMS,
  SQL_TOMBSTONES,
];
