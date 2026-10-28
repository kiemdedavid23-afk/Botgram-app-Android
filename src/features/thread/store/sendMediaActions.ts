/**
 * Envoi média / album (L6c) + map des fichiers pour « Renvoyer ».
 * FormData RN : { uri, type, name } — pas de second fetch.
 */
import {sendMedia, sendAlbum} from '../../../core/api/endpoints/messages';
import type {Message} from '../../../core/realtime/events';
import {uuidV4} from '../../../core/utils/uuid';
import {
  keepOutgoingCopy,
  promoteOutgoingCopy,
  dropOutgoingCopy,
} from '../../../core/media/outgoingCopy';
import {upsertOutgoing} from './sendActions';
import {threadTexts} from '../texts';
import {
  MEDIA_MAX_FILE_BYTES,
  MEDIA_MAX_BODY_BYTES,
  MEDIA_CAPTION_MAX,
  ALBUM_MIN,
  ALBUM_MAX,
  kindFromMime,
  albumKindFromMime,
  isAlbumEligibleMime,
} from '../mediaLimits';

export type PickedFile = {
  uri: string;
  name: string;
  mime: string;
  size: number;
};

type PendingMedia = {
  files: PickedFile[];
  caption: string;
};

/** Jamais persistée — vidée au clear / changement de conversation. */
const pendingByLocalId = new Map<string, PendingMedia>();

export function clearPendingMedia(): void {
  pendingByLocalId.clear();
}

export function getPendingMedia(localId: string): PendingMedia | undefined {
  return pendingByLocalId.get(localId);
}

export function hasPendingMedia(localId: string): boolean {
  return pendingByLocalId.has(localId);
}

type Slice = {
  conversationId: string | null;
  items: Message[];
  offline: boolean;
  sending: boolean;
  sendError: string | null;
};

type Ctx = {
  get: () => Slice;
  set: (
    p: Partial<Slice> | ((s: Slice) => Partial<Slice>),
  ) => void;
};

export type ValidateMediaError =
  | 'file_too_large'
  | 'body_too_large'
  | 'caption_too_long'
  | 'album_count'
  | 'album_types'
  | 'offline';

export function validateMediaSend(
  files: PickedFile[],
  caption: string,
  offline: boolean,
): ValidateMediaError | null {
  if (offline) return 'offline';
  if (caption.length > MEDIA_CAPTION_MAX) return 'caption_too_long';
  if (files.length === 1) {
    if (files[0]!.size > MEDIA_MAX_FILE_BYTES) return 'file_too_large';
    return null;
  }
  if (files.length < ALBUM_MIN || files.length > ALBUM_MAX) {
    return 'album_count';
  }
  let total = 0;
  for (const f of files) {
    if (!isAlbumEligibleMime(f.mime)) return 'album_types';
    if (f.size > MEDIA_MAX_FILE_BYTES) return 'file_too_large';
    total += f.size;
  }
  if (total > MEDIA_MAX_BODY_BYTES) return 'body_too_large';
  return null;
}

export function validateErrorText(code: ValidateMediaError): string {
  switch (code) {
    case 'file_too_large':
      return threadTexts.mediaFileTooLarge;
    case 'body_too_large':
      return threadTexts.mediaBodyTooLarge;
    case 'caption_too_long':
      return threadTexts.mediaCaptionTooLong;
    case 'album_count':
      return threadTexts.mediaAlbumCount;
    case 'album_types':
      return threadTexts.mediaAlbumTypes;
    case 'offline':
      return threadTexts.errorNetwork;
  }
}

function optimisticMedia(
  conversationId: string,
  files: PickedFile[],
  caption: string,
  clientId: string,
): Message {
  const multi = files.length > 1;
  return {
    id: `local:${clientId}`,
    conversation_id: conversationId,
    direction: 'out',
    kind: multi ? 'album' : kindFromMime(files[0]?.mime),
    text: caption || null,
    status: 'sending',
    client_message_id: clientId,
    created_at: Date.now(),
    attachment: multi
      ? null
      : {
          name: files[0]?.name,
          mime: files[0]?.mime,
          size: files[0]?.size,
        },
  };
}

function appendLocalFile(
  form: FormData,
  field: string,
  file: PickedFile,
): void {
  form.append(field, {
    uri: file.uri,
    type: file.mime || 'application/octet-stream',
    name: file.name || 'file',
  } as unknown as Blob);
}

export async function doSendMedia(
  files: PickedFile[],
  caption: string,
  ctx: Ctx,
  signal?: AbortSignal,
): Promise<void> {
  const {conversationId, offline} = ctx.get();
  if (!conversationId) return;
  const err = validateMediaSend(files, caption, offline);
  if (err) {
    ctx.set({sendError: validateErrorText(err)});
    return;
  }

  const clientId = uuidV4();
  const localId = `local:${clientId}`;
  pendingByLocalId.set(localId, {files, caption});

  // Copie locale (fichier unique), AVANT d'afficher la bulle : elle est lisible dès son apparition,
  // sans dépendre du Worker.
  if (files.length === 1) {
    try {
      await keepOutgoingCopy(files[0]!.uri, localId);
    } catch {
      // l'envoi continue sans copie
    }
  }

  const optimistic = optimisticMedia(
    conversationId,
    files,
    caption,
    clientId,
  );
  ctx.set(s => ({
    items: upsertOutgoing(s.items, optimistic),
    sending: true,
    sendError: null,
  }));

  const form = new FormData();
  form.append('client_message_id', clientId);
  if (caption) form.append('caption', caption);

  let res;
  if (files.length === 1) {
    const f = files[0]!;
    appendLocalFile(form, 'file', f);
    form.append('kind', kindFromMime(f.mime));
    res = await sendMedia(conversationId, form, signal);
  } else {
    const kinds: string[] = [];
    for (const f of files) {
      appendLocalFile(form, 'file', f);
      kinds.push(albumKindFromMime(f.mime));
    }
    form.append('kinds', kinds.join(','));
    res = await sendAlbum(conversationId, form, signal);
  }

  if (ctx.get().conversationId !== conversationId) return;

  if (signal?.aborted) {
    pendingByLocalId.delete(localId);
    await dropOutgoingCopy(localId);
    ctx.set(s => ({
      items: s.items.filter(m => m.id !== localId),
      sending: false,
      sendError: null,
    }));
    return;
  }

  if (!res.ok) {
    const failed: Message = {
      ...optimistic,
      status: 'failed',
      error_code: res.status === 0 ? 'local_network' : res.error.code,
      retryable: false,
    };
    // conserve pending pour « Renvoyer »
    ctx.set(s => ({
      items: upsertOutgoing(s.items, failed),
      sending: false,
      sendError: mapMediaSendError(res.error.code, res.status),
    }));
    return;
  }

  pendingByLocalId.delete(localId);
  const serverMsg = {
    ...res.data.message,
    client_message_id:
      res.data.message.client_message_id ?? clientId,
  };
  if (files.length === 1) {
    try {
      await promoteOutgoingCopy(localId, serverMsg.id);
    } catch {
      // la copie reste sous l'id provisoire : pas bloquant
    }
  }
  ctx.set(s => ({
    items: upsertOutgoing(s.items, serverMsg),
    sending: false,
    sendError: null,
  }));
}

function mapMediaSendError(code: string, status: number): string {
  if (status === 0) return threadTexts.errorNetwork;
  if (code === 'QUOTA_EXCEEDED') return threadTexts.errorQuota;
  if (code === 'PAYLOAD_TOO_LARGE') return threadTexts.mediaFileTooLarge;
  if (code === 'BOT_DISCONNECTED') return threadTexts.errorBotDisconnected;
  return threadTexts.errorGeneric;
}

/** Renvoyer média failed = nouvel envoi (nouveaux fichiers en mémoire). */
export async function doResendMediaAsNew(
  localMessage: Message,
  ctx: Ctx,
): Promise<void> {
  const pending = pendingByLocalId.get(localMessage.id);
  if (!pending) return;
  pendingByLocalId.delete(localMessage.id);
  await dropOutgoingCopy(localMessage.id);
  ctx.set(s => ({
    items: s.items.filter(m => m.id !== localMessage.id),
    sendError: null,
  }));
  await doSendMedia(pending.files, pending.caption, ctx);
}
