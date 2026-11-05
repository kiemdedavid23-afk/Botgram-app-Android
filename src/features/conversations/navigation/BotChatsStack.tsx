/**
 * Pile listes conversations + fil + profil contact (L5c).
 * Utilisable hors __DEV__ (module features, pas app/dev).
 */
import React, {useState, useCallback, useEffect} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {ConversationsScreen} from '../screens/ConversationsScreen';
import {ThreadScreen} from '../../thread/screens/ThreadScreen';
import {ContactProfileScreen} from '../../contacts';
import {
  useConversationsStore,
  conversationTitle,
} from '../store/conversationsStore';
import {useOpenRequestStore} from '../store/openRequestStore';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

type OpenThread = {
  id: string;
  title: string;
  photoUrl?: string | null;
  initials?: string | null;
};

type OpenProfile = {
  conversation: ConversationSummary;
  /** Si true, le retour ferme le profil et réaffiche le fil. */
  fromThread: boolean;
  thread?: OpenThread;
};

type Props = {
  footer?: React.ReactNode;
  /** Passé à la barre de marque de la liste des conversations. */
  headerRight?: React.ReactNode;
};

function summaryFromId(
  items: ConversationSummary[],
  id: string,
  fallback?: OpenThread,
): ConversationSummary {
  const c = items.find(i => i.id === id);
  if (c) return c;
  return {
    id,
    bot_id: '',
    title: fallback?.title ?? id,
    photo_url: fallback?.photoUrl ?? null,
    initials: fallback?.initials ?? null,
  };
}

export function BotChatsStack({
  footer,
  headerRight,
}: Props): React.JSX.Element {
  const [open, setOpen] = useState<OpenThread | null>(null);
  const [profile, setProfile] = useState<OpenProfile | null>(null);
  const items = useConversationsStore(s => s.items);

  const onOpenConversation = useCallback(
    (id: string) => {
      const c = items.find(i => i.id === id);
      setProfile(null);
      setOpen({
        id,
        title: c ? conversationTitle(c) : id,
        photoUrl: c?.photo_url,
        initials: c?.initials,
      });
    },
    [items],
  );

  // Ouverture demandée depuis un autre onglet (Contacts).
  const pendingOpen = useOpenRequestStore(s => s.pending);
  const consumeOpen = useOpenRequestStore(s => s.consume);
  useEffect(() => {
    if (!pendingOpen) return;
    const req = consumeOpen();
    if (req) {
      setOpen(null);
      setProfile({conversation: req.conversation, fromThread: false});
    }
  }, [pendingOpen, consumeOpen]);

  // Toucher sur une notification push : ouvre directement le fil.
  const pendingThreadId = useOpenRequestStore(s => s.pendingThreadId);
  const consumeThread = useOpenRequestStore(s => s.consumeThread);
  useEffect(() => {
    if (!pendingThreadId) return;
    const id = consumeThread();
    if (!id) return;
    const c = items.find(i => i.id === id);
    setProfile(null);
    setOpen({
      id,
      title: c ? conversationTitle(c) : '',
      photoUrl: c?.photo_url,
      initials: c?.initials,
    });
  }, [pendingThreadId, consumeThread, items]);

  const onOpenProfileFromList = useCallback(
    (id: string) => {
      setOpen(null);
      setProfile({
        conversation: summaryFromId(items, id),
        fromThread: false,
      });
    },
    [items],
  );

  const onOpenProfileFromThread = useCallback(() => {
    if (!open) return;
    setProfile({
      conversation: summaryFromId(items, open.id, open),
      fromThread: true,
      thread: open,
    });
  }, [items, open]);

  const closeProfile = useCallback(() => {
    setProfile(prev => {
      if (prev?.fromThread && prev.thread) {
        setOpen(prev.thread);
      }
      return null;
    });
  }, []);

  useEffect(() => {
    if (!open && !profile) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (profile) {
        closeProfile();
        return true;
      }
      if (open) {
        setOpen(null);
        return true;
      }
      return false;
    });
    return () => {
      sub.remove();
    };
  }, [open, profile, closeProfile]);

  if (profile) {
    return (
      <View style={styles.root}>
        <ContactProfileScreen
          conversation={profile.conversation}
          onBack={closeProfile}
          onMessage={() => onOpenConversation(profile.conversation.id)}
        />
      </View>
    );
  }

  if (open) {
    return (
      <View style={styles.root}>
        <ThreadScreen
          conversationId={open.id}
          title={open.title}
          photoUrl={open.photoUrl}
          initials={open.initials}
          onBack={() => setOpen(null)}
          onPressAvatar={onOpenProfileFromThread}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ConversationsScreen
        onOpenConversation={onOpenConversation}
        onOpenProfile={onOpenProfileFromList}
        headerRight={headerRight}
      />
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
