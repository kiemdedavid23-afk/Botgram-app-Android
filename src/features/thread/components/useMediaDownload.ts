/**
 * Téléchargement d'un attachment pour les lecteurs (vidéo / audio / vocal) :
 * état local (chemin, progression, erreur) au-dessus de loadAttachmentToStorage.
 * Le fichier reste sur le téléphone : la lecture suivante est instantanée, même hors ligne.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {loadAttachmentToStorage} from '../../../core/media/loadAttachment';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {onDownloadProgress} from '../../../core/media/native/nativeMedia';
import {threadTexts as t} from '../texts';

export type MediaDownload = {
  /** Chemin local si le fichier est déjà sur le téléphone. */
  path: string | null;
  loading: boolean;
  /** 0..1 (0 tant que la taille est inconnue). */
  progress: number;
  error: string | null;
  /** Télécharge si besoin ; retourne le chemin local ou null en cas d'échec. */
  download: () => Promise<string | null>;
};

export function useMediaDownload(
  messageId: string,
  opts: {autoStart?: boolean} = {},
): MediaDownload {
  const [path, setPath] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const busy = useRef<Promise<string | null> | null>(null);

  const download = useCallback((): Promise<string | null> => {
    if (busy.current) return busy.current;
    const job = (async (): Promise<string | null> => {
      const storage = getMediaStorage();
      if (await storage.exists(messageId)) {
        const p = storage.localPath(messageId);
        if (alive.current) setPath(p);
        return p;
      }
      // Message en cours d'envoi : rien à télécharger (seule la copie locale compte).
      if (messageId.startsWith('local:')) return null;
      if (alive.current) {
        setLoading(true);
        setError(null);
        setProgress(0);
      }
      const net = await NetInfo.fetch();
      if (net.isConnected === false) {
        if (alive.current) {
          setLoading(false);
          setError(t.mediaOffline);
        }
        return null;
      }
      const off = onDownloadProgress(messageId, (received, total) => {
        if (alive.current && total > 0) setProgress(received / total);
      });
      const res = await loadAttachmentToStorage(messageId);
      off();
      if (!alive.current) return res.ok ? res.path : null;
      setLoading(false);
      if (!res.ok) {
        setError(
          res.code === 'PAYLOAD_TOO_LARGE' ? t.mediaTooLarge : t.mediaLoadError,
        );
        return null;
      }
      setProgress(1);
      setPath(res.path);
      return res.path;
    })().finally(() => {
      busy.current = null;
    });
    busy.current = job;
    return job;
  }, [messageId]);

  useEffect(() => {
    alive.current = true;
    setPath(null);
    setError(null);
    const storage = getMediaStorage();
    storage
      .exists(messageId)
      .then(found => {
        if (!alive.current) return;
        if (found) setPath(storage.localPath(messageId));
        else if (opts.autoStart) download().catch(() => {});
      })
      .catch(() => {});
    return () => {
      alive.current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messageId]);

  return {path, loading, progress, error, download};
}
