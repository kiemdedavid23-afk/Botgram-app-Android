/**
 * Extrait d'une liste de messages ce qu'affiche l'onglet « Partagés » du profil contact :
 * médias (photos / vidéos), documents et liens. Logique pure, sans réseau.
 */
import type {Message} from '../../../core/realtime/events';

export type SharedAttachment = {name?: string; mime?: string; size?: number};

export type MediaEntry = {
  id: string;
  type: 'photo' | 'video';
  at: number;
  mime?: string;
  size?: number;
};

export type DocEntry = {
  id: string;
  at: number;
  name: string;
  mime?: string;
  size?: number;
};

export type LinkEntry = {
  /** Identifiant stable : message + position du lien. */
  id: string;
  url: string;
  host: string;
  at: number;
};

export type SharedContent = {
  media: MediaEntry[];
  docs: DocEntry[];
  links: LinkEntry[];
};

const VIDEO_KINDS = new Set(['video', 'animation', 'video_note']);
const URL_RE = /https?:\/\/[^\s<>"'`]+/gi;
const HREF_RE = /href\s*=\s*["'](https?:\/\/[^"']+)["']/gi;

function stamp(m: {created_at?: number; sent_at?: number | null}): number {
  return m.created_at ?? m.sent_at ?? 0;
}

function mediaTypeOf(
  kind: string,
  att?: SharedAttachment | null,
): 'photo' | 'video' | 'document' | 'audio' | null {
  const mime = att?.mime ?? '';
  if (kind === 'photo') return 'photo';
  if (VIDEO_KINDS.has(kind)) return 'video';
  if (kind === 'audio') return 'audio';
  if (kind === 'document') {
    if (mime.startsWith('image/')) return 'photo';
    if (mime.startsWith('video/')) return 'video';
    return 'document';
  }
  return null;
}

function cleanUrl(raw: string): string {
  // Ponctuation de fin de phrase collée au lien : « voir https://x.com/a. »
  return raw.replace(/[.,;:!?)\]}»]+$/u, '');
}

function hostOf(url: string): string {
  const m = /^https?:\/\/([^/?#]+)/i.exec(url);
  return (m?.[1] ?? url).replace(/^www\./i, '');
}

export function extractLinks(text: string | null | undefined): string[] {
  if (!text) return [];
  const found: string[] = [];
  for (const re of [HREF_RE, URL_RE]) {
    re.lastIndex = 0;
    let match: RegExpExecArray | null = re.exec(text);
    while (match) {
      found.push(cleanUrl((re === HREF_RE ? match[1] : match[0]) ?? ''));
      match = re.exec(text);
    }
  }
  return Array.from(new Set(found.filter(u => u.length > 8)));
}

function fileName(att: SharedAttachment | null | undefined, fallback: string) {
  const n = att?.name?.trim();
  return n || fallback;
}

/** Du plus récent au plus ancien. */
export function collectSharedContent(
  messages: ReadonlyArray<Message>,
  docFallbackName: string,
): SharedContent {
  const media: MediaEntry[] = [];
  const docs: DocEntry[] = [];
  const links: LinkEntry[] = [];
  const seenMedia = new Set<string>();

  const addAttachment = (
    id: string,
    kind: string,
    att: SharedAttachment | null | undefined,
    at: number,
  ): void => {
    if (seenMedia.has(id)) return;
    const type = mediaTypeOf(kind, att);
    if (!type) return;
    seenMedia.add(id);
    if (type === 'photo' || type === 'video') {
      media.push({id, type, at, mime: att?.mime, size: att?.size});
    } else {
      docs.push({
        id,
        at,
        name: fileName(att, docFallbackName),
        mime: att?.mime,
        size: att?.size,
      });
    }
  };

  for (const m of messages) {
    const at = stamp(m);
    if (m.kind === 'album' && m.album) {
      for (const a of m.album) {
        addAttachment(a.id, a.kind, a.attachment, a.created_at ?? at);
        extractLinks(a.text).forEach((url, i) =>
          links.push({id: `${a.id}:${i}`, url, host: hostOf(url), at}),
        );
      }
    } else {
      addAttachment(m.id, m.kind, m.attachment, at);
    }
    extractLinks(m.text).forEach((url, i) =>
      links.push({id: `${m.id}:${i}`, url, host: hostOf(url), at}),
    );
  }

  const byDateDesc = <T extends {at: number}>(a: T, b: T): number => b.at - a.at;
  media.sort(byDateDesc);
  docs.sort(byDateDesc);
  links.sort(byDateDesc);

  // Un même lien envoyé plusieurs fois n'apparaît qu'une fois (le plus récent).
  const seenUrl = new Set<string>();
  const uniqueLinks = links.filter(l => {
    if (seenUrl.has(l.url)) return false;
    seenUrl.add(l.url);
    return true;
  });

  return {media, docs, links: uniqueLinks};
}

const MONTHS = [
  'janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
  'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.',
];

/** « 27 oct. » (avec l'année si ce n'est pas l'année en cours). */
export function formatShortDate(ts: number): string {
  if (!ts) return '';
  const d = new Date(ts < 1e12 ? ts * 1000 : ts);
  const base = `${d.getDate()} ${MONTHS[d.getMonth()]}`;
  return d.getFullYear() === new Date().getFullYear()
    ? base
    : `${base} ${d.getFullYear()}`;
}

export function extensionOf(name?: string | null): string {
  if (!name || !name.includes('.')) return '';
  return (name.split('.').pop() ?? '').toUpperCase();
}

export function formatBytes(n?: number | null): string {
  if (!n || n <= 0) return '';
  if (n >= 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  return `${Math.max(1, Math.round(n / 1024))} Ko`;
}
