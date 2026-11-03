/** Classification des erreurs d'ouverture archive (M1). */

export function isTransientOpenError(message: string): boolean {
  const m = message.toLowerCase();
  return (
    m.includes('locked') ||
    m.includes('busy') ||
    m.includes('sqlite_busy') ||
    m.includes('sqlite_full') ||
    m.includes('disk i/o') ||
    m.includes('ioerr') ||
    m.includes('unable to open database file')
  );
}

/**
 * Base illisible / mauvaise clé uniquement.
 * Toute autre erreur (migration, etc.) → pas de reset.
 */
export function isUnreadableDbError(message: string): boolean {
  if (isTransientOpenError(message)) return false;
  const m = message.toLowerCase();
  return (
    m.includes('not a database') ||
    m.includes('file is not a database') ||
    m.includes('malformed') ||
    m.includes('corrupt') ||
    m.includes('file is encrypted') ||
    m.includes('hmac') ||
    m.includes('unsupported file format') ||
    m.includes('wrong key') ||
    m.includes('bad key')
  );
}
