/** Calculs purs du curseur de réglages (testables sans React Native). */

export function clamp(n: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, n));
}

/** Position x (0 = début de la piste utile) → valeur entière dans [min, max]. */
export function positionToValue(
  x: number,
  usableWidth: number,
  min: number,
  max: number,
): number {
  if (usableWidth <= 0) {
    return min;
  }
  const ratio = clamp(x / usableWidth, 0, 1);
  return Math.round(min + ratio * (max - min));
}

/** Valeur → proportion 0..1 de la piste. */
export function valueToRatio(value: number, min: number, max: number): number {
  if (max === min) {
    return 0;
  }
  return clamp((value - min) / (max - min), 0, 1);
}
