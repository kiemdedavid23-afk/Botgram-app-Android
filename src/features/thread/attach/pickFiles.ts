/**
 * Sélecteur de fichiers du système (sans permission). Sert à l'onglet Fichier
 * et de solution de repli quand l'accès à la galerie est refusé.
 */
import {
  pick,
  types,
  isErrorWithCode,
  errorCodes,
} from '@react-native-documents/picker';
import type {PickedFile} from '../store/sendMediaActions';

export async function pickFiles(
  mediaOnly: boolean,
): Promise<PickedFile[] | null> {
  try {
    const results = await pick({
      allowMultiSelection: true,
      type: mediaOnly ? [types.images, types.video] : [types.allFiles],
    });
    return results.map(r => ({
      uri: r.uri,
      name: r.name ?? 'file',
      mime: r.type ?? 'application/octet-stream',
      size: typeof r.size === 'number' ? r.size : 0,
    }));
  } catch (e) {
    if (isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED) {
      return null;
    }
    return null;
  }
}
