import {useEffect, useState} from 'react';
import {archiveSearchMessages} from '../../../core/archive/hydrate';
import {isSearchable} from '../../../core/archive/searchQuery';
import type {MessageSearchHit} from '../../../core/archive/ftsRepo';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {useConversationsStore} from '../store/conversationsStore';

/**
 * Recherche locale dans les messages du bot courant (archive, hors ligne).
 * Délai 250 ms ; une réponse périmée est ignorée.
 */
export function useMessageSearch(query: string): MessageSearchHit[] {
  const botId = useConversationsStore(s => s.botId);
  const [hits, setHits] = useState<MessageSearchHit[]>([]);

  useEffect(() => {
    if (!botId || !isSearchable(query)) {
      setHits([]);
      return;
    }
    let stale = false;
    const timer = setTimeout(() => {
      fireAndForget(
        archiveSearchMessages(botId, query, cm.msgSearchLimit).then(res => {
          if (!stale) {
            setHits(res ? res.hits : []);
          }
        }),
      );
    }, cm.msgSearchDebounceMs);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  }, [botId, query]);

  return hits;
}
