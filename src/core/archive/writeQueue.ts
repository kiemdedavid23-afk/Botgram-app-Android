/**
 * File d'attente d'écritures archive (une seule à la fois).
 * Une erreur ne bloque pas les écritures suivantes.
 */
let tail: Promise<void> = Promise.resolve();

export function enqueueWrite<T>(job: () => Promise<T>): Promise<T> {
  const run = tail.then(job, job);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}
