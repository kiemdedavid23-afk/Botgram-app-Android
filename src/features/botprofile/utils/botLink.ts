/** Lien Telegram public d'un bot, formé à partir de son pseudo. */
export function botLink(username: string | null | undefined): string | null {
  const u = (username ?? '').trim().replace(/^@+/, '');
  if (u.length === 0) return null;
  return `https://t.me/${u}`;
}
