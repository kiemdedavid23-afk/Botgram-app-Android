/** Faux op-sqlite — déclaré comme tel (6bis-a). Pas de SQLCipher natif en jest. */
type Row = Record<string, string | number | null>;

const tables = new Map<string, Row[]>();

function ensureProof(): Row[] {
  if (!tables.has('archive_proof')) tables.set('archive_proof', []);
  return tables.get('archive_proof')!;
}

const db = {
  execute: jest.fn(async (query: string, params?: Array<string | number>) => {
    const q = query.replace(/\s+/g, ' ').trim().toUpperCase();
    if (q.startsWith('CREATE TABLE')) {
      ensureProof();
      return {rowsAffected: 0, rows: []};
    }
    if (q.startsWith('INSERT INTO ARCHIVE_PROOF')) {
      const rows = ensureProof();
      rows.push({
        id: rows.length + 1,
        label: String(params?.[0] ?? ''),
        created_at: Number(params?.[1] ?? 0),
      });
      return {rowsAffected: 1, rows: []};
    }
    if (q.includes('COUNT(*)')) {
      const rows = ensureProof();
      return {rowsAffected: 0, rows: [{c: rows.length}]};
    }
    if (q.startsWith('DELETE FROM ARCHIVE_PROOF')) {
      tables.set('archive_proof', []);
      return {rowsAffected: 0, rows: []};
    }
    return {rowsAffected: 0, rows: []};
  }),
  close: jest.fn(() => undefined),
  closeAsync: jest.fn(async () => undefined),
};

export function open(_opts: {name: string; encryptionKey?: string}) {
  return db;
}

export function openAsync(opts: {name: string; encryptionKey?: string}) {
  return Promise.resolve(open(opts));
}

export function isSQLCipher() {
  return true;
}

export function __resetOpSqliteMock(): void {
  tables.clear();
  db.execute.mockClear();
  db.close.mockClear();
}
