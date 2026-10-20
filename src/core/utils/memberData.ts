/**
 * Registre unique des nettoyeurs de données membre (annexe 13.5).
 * core n\'importe jamais features : chaque store s\'enregistre lui-même.
 */
type Cleaner = () => void | Promise<void>;

const cleaners = new Set<Cleaner>();

/**
 * Enregistre un nettoyeur. Renvoie la fonction de désinscription.
 */
export function registerMemberDataCleaner(fn: Cleaner): () => void {
  cleaners.add(fn);
  return () => {
    cleaners.delete(fn);
  };
}

/**
 * Exécute tous les nettoyeurs. Tolère les erreurs d\'un nettoyeur
 * et n\'interrompt jamais la boucle.
 */
export async function clearMemberData(): Promise<void> {
  const list = Array.from(cleaners);
  for (const fn of list) {
    try {
      await fn();
    } catch {
      // un nettoyeur défaillant ne bloque pas les autres
    }
  }
}
