/**
 * Retire les balises HTML / MarkdownV2 d'un aperçu de message (S6).
 * Produit du texte simple pour la liste — jamais de rendu HTML.
 */
export function stripPreview(raw: string | null | undefined): string {
  if (!raw) return '';
  let s = raw;
  s = s.replace(/<[^>]+>/g, '');
  s = s.replace(/\\([_*[\]()~`>#+\-=|{}.!\\])/g, '$1');
  s = s.replace(/[*_~`]{1,3}/g, '');
  s = s.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}
