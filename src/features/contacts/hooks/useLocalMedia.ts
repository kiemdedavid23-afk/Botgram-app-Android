/**
 * État d'un fichier média par rapport au téléphone : déjà là ou non, et
 * téléchargement à la demande (mêmes règles que les bulles du fil).
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import NetInfo from '@react-native-community/netinfo';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {loadAttachmentToStorage} from '../../../core/media/loadAttachment';
import {rememberDownloadMeta} from '../../../core/media/downloadMeta';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {contactsTexts as t} from '../texts';

type Options = {kind: 'photo' | 'video' | 'document'; name?: string | null};

export type LocalMedia = {
  /** null = vérification en cours. */
  local: boolean | null;
  loading: boolean;
  error: string | null;
  /** Garantit la présence du fichier ; true si disponible sur le téléphone. */
  ensure: () => Promise<boolean>;
  path: string;
};

export function useLocalMedia(messageId: string, opts: Options): LocalMedia {
  const [local, setLocal] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const {kind, name} = opts;
  const path = getMediaStorage().localPath(messageId);

  useEffect(() => {
    alive.current = true;
    fireAndForget(
      getMediaStorage()
        .exists(messageId)
        .catch(() => false)
        .then(ok => {
          if (alive.current) setLocal(ok);
        }),
    );
    return () => {
      alive.current = false;
    };
  }, [messageId]);

  const ensure = useCallback(async (): Promise<boolean> => {
    if (await getMediaStorage().exists(messageId).catch(() => false)) {
      if (alive.current) setLocal(true);
      return true;
    }
    const net = await NetInfo.fetch();
    if (net.isConnected === false) {
      if (alive.current) setError(t.offline);
      return false;
    }
    if (alive.current) {
      setLoading(true);
      setError(null);
    }
    rememberDownloadMeta(messageId, kind, name);
    const res = await loadAttachmentToStorage(messageId);
    if (!alive.current) return res.ok;
    setLoading(false);
    if (!res.ok) {
      if (res.code !== 'cancelled') {
        setError(res.code === 'PAYLOAD_TOO_LARGE' ? t.tooLarge : t.loadError);
      }
      return false;
    }
    setLocal(true);
    return true;
  }, [messageId, kind, name]);

  return {local, loading, error, ensure, path};
}
