/**
 * Interface archive locale (13.11) — 6bis-a : preuve d'ouverture SQLCipher.
 * Les lots suivants remplissent le schéma réel.
 */

export type ArchiveStore = {
  /** Ouvre (ou réouvre) la base chiffrée. */
  open: () => Promise<void>;
  /** Ferme la connexion. */
  close: () => Promise<void>;
  /** true si open() a réussi. */
  isOpen: () => boolean;
  /** Table de preuve 6bis-a uniquement. */
  proofInsert: (label: string) => Promise<void>;
  proofCount: () => Promise<number>;
  /** Efface toutes les données archive (13.5). */
  clearAll: () => Promise<void>;
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
