/**
 * Contenu partagé d'une conversation, lu sur le téléphone (aucun réseau) :
 * messages en cache chiffré (`thread.messages.<id>`), complétés par le fil
 * s'il est ouvert sur cette conversation.
 */
import {useEffect, useMemo, useState} from 'react';
import {cacheGetString} from '../../../core/storage';
import {useThreadStore} from '../../thread/store/threadStore';
import type {Message} from '../../../core/realtime/events';
import {contactsTexts as t} from '../texts';
import {collectSharedContent, type SharedContent} from '../utils/sharedMedia';

const CACHE_PREFIX = 'thread.messages.';

const EMPTY: SharedContent = {media: [], docs: [], links: []};

export function useSharedContent(conversationId: string): {
  content: SharedContent;
  ready: boolean;
} {
  const [cached, setCached] = useState<Message[]>([]);
  const [ready, setReady] = useState(false);
  const threadId = useThreadStore(s => s.conversationId);
  const threadItems = useThreadStore(s => s.items);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = await cacheGetString(`${CACHE_PREFIX}${conversationId}`);
        if (alive && raw) {
          const parsed: unknown = JSON.parse(raw);
          if (Array.isArray(parsed)) setCached(parsed as Message[]);
        }
      } catch {
        // cache illisible : on affiche simplement « rien »
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [conversationId]);

  const content = useMemo(() => {
    const live = threadId === conversationId ? threadItems : [];
    const byId = new Map<string, Message>();
    cached.forEach(m => byId.set(m.id, m));
    live.forEach(m => byId.set(m.id, m));
    if (byId.size === 0) return EMPTY;
    return collectSharedContent(Array.from(byId.values()), t.docFallbackName);
  }, [cached, threadId, threadItems, conversationId]);

  return {content, ready};
}
