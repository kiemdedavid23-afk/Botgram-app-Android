/**
 * Registre unique des nettoyeurs de données membre (annexe 13.5).
 * core n'importe jamais features : chaque store s'enregistre lui-même.
 */
type Cleaner = () => void | Promise<void>;

const cleaners = new Set<Cleaner>();

export function registerMemberDataCleaner(fn: Cleaner): () => void {
  cleaners.add(fn);
  return () => {
    cleaners.delete(fn);
  };
}

/**
 * Exécute tous les nettoyeurs. Continue après une erreur.
 * Si au moins un a échoué, rejette avec la première erreur (après la boucle).
 */
export async function clearMemberData(): Promise<void> {
  const list = Array.from(cleaners);
  let firstError: unknown = null;
  for (const fn of list) {
    try {
      await fn();
    } catch (e) {
      if (firstError === null) firstError = e;
    }
  }
  if (firstError !== null) {
    throw firstError;
  }
}
