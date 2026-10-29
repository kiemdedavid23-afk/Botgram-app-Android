/**
 * Galerie de la conversation ouverte : toutes les photos déjà présentes sur le téléphone
 * (photos seules et photos d'albums), dans l'ordre de la conversation.
 * Sert à la visionneuse pour passer d'une photo à l'autre en glissant.
 */
import {useThreadStore} from './store/threadStore';
import {getMediaStorage} from '../../core/media/MediaStorage';
import type {ViewerImage} from '../../core/media/imageViewer';
import type {AlbumItem} from '../../core/realtime/events';

function isAlbumPhoto(item: AlbumItem): boolean {
  return (
    item.kind === 'photo' || (item.attachment?.mime ?? '').startsWith('image/')
  );
}

function toFileUri(path: string): string {
  return path.startsWith('file://') ? path : `file://${path}`;
}

/**
 * `currentId` / `currentUri` : la photo touchée. Si elle n'est pas dans la conversation chargée,
 * la visionneuse s'ouvre simplement sur cette photo seule.
 */
export async function buildPhotoGallery(
  currentId: string,
  currentUri: string,
): Promise<{items: ViewerImage[]; index: number}> {
  const ids: string[] = [];
  for (const m of useThreadStore.getState().items) {
    if (m.kind === 'photo') {
      ids.push(m.id);
    } else if (m.album) {
      for (const a of m.album) {
        if (isAlbumPhoto(a)) ids.push(a.id);
      }
    }
  }
  if (!ids.includes(currentId)) {
    return {items: [{uri: currentUri}], index: 0};
  }

  const storage = getMediaStorage();
  const present = await Promise.all(
    ids.map(id =>
      id === currentId ? Promise.resolve(true) : storage.exists(id).catch(() => false),
    ),
  );

  const items: ViewerImage[] = [];
  let index = 0;
  ids.forEach((id, i) => {
    if (!present[i]) return;
    if (id === currentId) {
      index = items.length;
      items.push({uri: currentUri});
    } else {
      items.push({uri: toFileUri(storage.localPath(id))});
    }
  });
  return {items, index};
}
