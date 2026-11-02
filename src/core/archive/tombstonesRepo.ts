/**
 * Tombstones = seul mécanisme de suppressions locales (13.11 / 6bis).
 */
import type {DB} from '@op-engineering/op-sqlite';

export type TombstoneEntity = 'conversation' | 'message';
export type TombstoneReason =
  | 'user_deleted'
  | 'server_removed'
  | 'message_deleted';

export async function insertTombstone(
  db: DB,
  entityType: TombstoneEntity,
  entityId: string,
  reason: TombstoneReason,
): Promise<void> {
  await db.execute(
    `INSERT INTO tombstones (entity_type, entity_id, tombstoned_at, reason)
     VALUES (?, ?, ?, ?)
     ON CONFLICT(entity_type, entity_id) DO UPDATE SET
       tombstoned_at=excluded.tombstoned_at,
       reason=excluded.reason;`,
    [entityType, entityId, Date.now(), reason],
  );
}

export async function hasTombstone(
  db: DB,
  entityType: TombstoneEntity,
  entityId: string,
): Promise<boolean> {
  const res = await db.execute(
    `SELECT 1 AS x FROM tombstones
     WHERE entity_type = ? AND entity_id = ? LIMIT 1;`,
    [entityType, entityId],
  );
  return res.rows.length > 0;
}
