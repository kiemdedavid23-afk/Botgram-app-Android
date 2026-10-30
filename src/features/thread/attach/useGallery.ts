/**
 * Galerie : permission + chargement par pages (60 éléments), du plus récent au plus ancien.
 */
import {useCallback, useEffect, useRef, useState} from 'react';
import {AppState, Linking} from 'react-native';
import {
  queryGalleryAssets,
  type GalleryAsset,
} from './nativeAttach';
import {
  checkGalleryAccess,
  requestGalleryAccess,
  type GalleryAccess,
} from './permissions';
import {fireAndForget} from '../../../core/utils/fireAndForget';

const PAGE = 60;

export function useGallery(active: boolean): {
  access: GalleryAccess;
  assets: GalleryAsset[];
  loading: boolean;
  loadMore: () => void;
  request: () => void;
  openSettings: () => void;
  /** Android 14 : rouvre le choix des photos autorisées. */
  manageLimited: () => void;
} {
  const [access, setAccess] = useState<GalleryAccess>('unknown');
  const [assets, setAssets] = useState<GalleryAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const offset = useRef(0);
  const busy = useRef(false);
  const done = useRef(false);
  const accessRef = useRef<GalleryAccess>('unknown');

  const loadMore = useCallback(() => {
    if (busy.current || done.current) return;
    busy.current = true;
    setLoading(true);
    fireAndForget(
      queryGalleryAssets(offset.current, PAGE)
        .then(page => {
          offset.current += page.length;
          if (page.length < PAGE) done.current = true;
          setAssets(prev => [...prev, ...page]);
        })
        .catch(() => {
          done.current = true;
        })
        .finally(() => {
          busy.current = false;
          setLoading(false);
        }),
    );
  }, []);

  const restart = useCallback(
    (next: GalleryAccess) => {
      accessRef.current = next;
      setAccess(next);
      offset.current = 0;
      done.current = false;
      busy.current = false;
      setAssets([]);
      if (next === 'full' || next === 'limited') loadMore();
    },
    [loadMore],
  );

  // À l'ouverture du tiroir, et au retour des réglages système.
  useEffect(() => {
    if (!active) return undefined;
    fireAndForget(checkGalleryAccess().then(restart));
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        fireAndForget(
          checkGalleryAccess().then(next => {
            if (next !== accessRef.current) restart(next);
          }),
        );
      }
    });
    return () => sub.remove();
  }, [active, restart]);

  const request = useCallback(() => {
    fireAndForget(requestGalleryAccess().then(restart));
  }, [restart]);

  const openSettings = useCallback(() => {
    fireAndForget(Linking.openSettings());
  }, []);

  const manageLimited = useCallback(() => {
    // Android 14 : redemander l'accès rouvre le sélecteur de photos autorisées.
    fireAndForget(requestGalleryAccess().then(restart));
  }, [restart]);

  return {access, assets, loading, loadMore, request, openSettings, manageLimited};
}
