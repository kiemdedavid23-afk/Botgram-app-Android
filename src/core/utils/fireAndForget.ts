/**
 * Lance une promesse sans attendre son résultat.
 * Les erreurs sont avalées silencieusement.
 */
export function fireAndForget(p: Promise<unknown>): void {
  p.catch(() => {
    // intentionnel : pas de remontée
  });
}
