/**
 * Pile listes conversations + fil (L5c).
 * Utilisable hors __DEV__ (module features, pas app/dev).
 */
import React, {useState, useCallback} from 'react';
import {View, StyleSheet} from 'react-native';
import {ConversationsScreen} from '../screens/ConversationsScreen';
import {ThreadScreen} from '../../thread/screens/ThreadScreen';
import {useConversationsStore} from '../store/conversationsStore';
import {conversationTitle} from '../store/conversationsStore';

type OpenConv = {
  id: string;
  title: string;
  photoUrl?: string | null;
  initials?: string | null;
};

type Props = {
  /** Contenu sous la pile (ex. BotBottomNav). */
  footer?: React.ReactNode;
};

export function BotChatsStack({footer}: Props): React.JSX.Element {
  const [open, setOpen] = useState<OpenConv | null>(null);
  const items = useConversationsStore(s => s.items);

  const onOpenConversation = useCallback(
    (id: string) => {
      const c = items.find(i => i.id === id);
      setOpen({
        id,
        title: c ? conversationTitle(c) : id,
        photoUrl: c?.photo_url,
        initials: c?.initials,
      });
    },
    [items],
  );

  if (open) {
    return (
      <View style={styles.root}>
        <ThreadScreen
          conversationId={open.id}
          title={open.title}
          photoUrl={open.photoUrl}
          initials={open.initials}
          onBack={() => setOpen(null)}
        />
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <ConversationsScreen onOpenConversation={onOpenConversation} />
      {footer}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
