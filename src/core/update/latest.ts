/** Dernière version publiée par le Worker (registre des versions par canal). */
export type LatestBuild = {
  version_code?: number;
  version_name?: string;
  download_url?: string;
  sha256?: string;
  size_bytes?: number;
  notes?: string;
};

export type UpdateLevel = 'none' | 'optional' | 'required';

export function toUpdateLevel(raw: unknown): UpdateLevel {
  return raw === 'optional' || raw === 'required' ? raw : 'none';
}

const str = (v: unknown): string | undefined =>
  typeof v === 'string' && v.length > 0 ? v : undefined;
const num = (v: unknown): number | undefined =>
  typeof v === 'number' && Number.isFinite(v) ? v : undefined;

/**
 * `details.latest` d'un 426 ou `latest` de GET /app/updates : objet (contrat actuel),
 * ou simple texte (ancien format = version seule).
 */
export function parseLatest(raw: unknown): LatestBuild | undefined {
  if (typeof raw === 'string') {
    return raw.length > 0 ? {version_name: raw} : undefined;
  }
  if (raw == null || typeof raw !== 'object') return undefined;
  const o = raw as Record<string, unknown>;
  return {
    version_code: num(o.version_code),
    version_name: str(o.version_name),
    download_url: str(o.download_url),
    sha256: str(o.sha256),
    size_bytes: num(o.size_bytes),
    notes: str(o.notes),
  };
}
