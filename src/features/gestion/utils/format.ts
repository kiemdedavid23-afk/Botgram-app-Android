/**
 * Format dates et fuseaux — site features/gestion/utils/format.ts
 */
export function timeAgo(ms: number): string {
  const diff = Date.now() - ms;
  const min = Math.floor(diff / 60000);
  if (min < 2) return "à l'instant";
  if (min < 60) return `il y a ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `il y a ${h} h`;
  const d = Math.floor(h / 24);
  if (d === 1) return 'hier';
  return `il y a ${d} j`;
}

export function shortDate(ms: number): string {
  return new Date(ms).toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'short',
  });
}

export function isMobileDevice(device: string): boolean {
  return /android|iphone|ipad|ios/i.test(device);
}

export const TIMEZONES = [
  'Africa/Ouagadougou',
  'Africa/Abidjan',
  'Africa/Dakar',
  'Africa/Bamako',
  'Africa/Lagos',
  'Africa/Douala',
  'Europe/Paris',
  'Europe/Brussels',
  'America/Toronto',
  'America/New_York',
  'UTC',
] as const;

export function timezoneLabel(tz: string): string {
  const city = tz.split('/').pop() || tz;
  return city.replace(/_/g, ' ');
}

export function deviceTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
}
