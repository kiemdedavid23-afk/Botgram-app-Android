import {useEffect} from 'react';
import {useBotPhotoStore} from './botPhotoStore';
import {fireAndForget} from '../../core/utils/fireAndForget';

/**
 * URI locale de la photo du bot (null = pas de photo ou pas encore connue).
 * Déclenche la lecture du cache / le téléchargement si besoin.
 */
export function useBotPhotoUri(botId?: string | null): string | null {
  const uri = useBotPhotoStore(s => (botId ? s.photos[botId]?.uri ?? null : null));
  const ensure = useBotPhotoStore(s => s.ensure);
  useEffect(() => {
    if (botId) fireAndForget(ensure(botId));
  }, [botId, ensure]);
  return uri;
}
