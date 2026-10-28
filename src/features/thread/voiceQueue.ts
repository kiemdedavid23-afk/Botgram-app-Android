/**
 * File de lecture des vocaux : quand on lance un vocal, les vocaux reçus juste après
 * (consécutifs dans le fil) sont préchargés puis enchaînés automatiquement.
 */
import {useThreadStore} from './store/threadStore';
import {messageTimestamp} from './store/mergeMessages';
import {getMediaStorage} from '../../core/media/MediaStorage';
import {loadAttachmentToStorage} from '../../core/media/loadAttachment';
import type {AudioItem} from '../../core/media/native/nativeMedia';
import {threadTexts as t} from './texts';

const MAX_FOLLOWING = 8;
const PREFETCH_BUDGET_MS = 1500;

/** Vocaux qui suivent `messageId`, sans interruption par un autre type de message. */
export function followingVoiceIds(messageId: string): string[] {
  const items = [...useThreadStore.getState().items].sort(
    (a, b) => messageTimestamp(a) - messageTimestamp(b),
  );
  const i = items.findIndex(m => m.id === messageId);
  if (i < 0) return [];
  const out: string[] = [];
  for (let j = i + 1; j < items.length && out.length < MAX_FOLLOWING; j += 1) {
    const m = items[j]!;
    if (m.kind !== 'voice' || m.id.startsWith('local:')) break;
    out.push(m.id);
  }
  return out;
}

/**
 * Construit la file [vocal courant, suivants déjà sur le téléphone].
 * Le préchargement des suivants a un budget de temps : le vocal courant démarre toujours vite.
 */
export async function buildVoiceQueue(
  messageId: string,
  title: string = t.kindVoice,
): Promise<AudioItem[]> {
  const storage = getMediaStorage();
  const ids = followingVoiceIds(messageId);

  const prefetch = (async () => {
    for (const id of ids) {
      if (await storage.exists(id)) continue;
      const res = await loadAttachmentToStorage(id);
      if (!res.ok) break;
    }
  })();
  await Promise.race([
    prefetch,
    new Promise<void>(resolve => {
      setTimeout(resolve, PREFETCH_BUDGET_MS);
    }),
  ]);

  const queue: AudioItem[] = [
    {id: messageId, path: storage.localPath(messageId), title},
  ];
  for (const id of ids) {
    if (!(await storage.exists(id))) break;
    queue.push({id, path: storage.localPath(id), title});
  }
  return queue;
}
