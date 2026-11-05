/**
 * Onglet Contacts : liste paginée des contacts du bot, recherche, ouverture
 * de la conversation du contact.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {useTheme, fontSize} from '../../../shared/theme';
import {SearchBar} from '../../../shared/components/SearchBar';
import {EmptyScreen} from '../../../shared/components/EmptyScreen';
import {contactsMetrics as cmx} from '../../../shared/theme/contactsMetrics';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {Contact} from '../../../core/api/endpoints/contacts';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {findConversationForContact} from '../utils/findConversation';
import {useContactsStore} from '../store/contactsStore';
import {ContactListItem} from '../components/ContactListItem';
import {contactsTexts as t} from '../texts';

export type OpenContactRequest = {
  /** Conversation privée du contact : sa fiche s'ouvre dans l'onglet Échanges. */
  conversation: ConversationSummary;
};

type Props = {
  botId: string | null;
  onOpenConversation: (request: OpenContactRequest) => void;
};

export function ContactsScreen({
  botId,
  onOpenConversation,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [query, setQuery] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const setBotId = useContactsStore(s => s.setBotId);
  const load = useContactsStore(s => s.load);
  const loadMore = useContactsStore(s => s.loadMore);
  const search = useContactsStore(s => s.search);
  const clearSearch = useContactsStore(s => s.clearSearch);
  const items = useContactsStore(s => s.items);
  const searchItems = useContactsStore(s => s.searchItems);
  const loading = useContactsStore(s => s.loading);
  const loadingMore = useContactsStore(s => s.loadingMore);
  const searching = useContactsStore(s => s.searching);
  const error = useContactsStore(s => s.error);
  const offline = useContactsStore(s => s.offline);

  useEffect(() => {
    setBotId(botId);
  }, [botId, setBotId]);

  const searchActive = query.trim().length > 0;

  useEffect(() => {
    if (!searchActive) {
      clearSearch();
      return undefined;
    }
    const timer = setTimeout(() => {
      fireAndForget(search(query));
    }, cmx.searchDebounceMs);
    return () => clearTimeout(timer);
  }, [query, searchActive, search, clearSearch]);

  const onPressContact = useCallback(
    async (contact: Contact) => {
      if (!botId) return;
      setNotice(null);
      const conv = await findConversationForContact(botId, contact);
      if (!conv) {
        setNotice(t.conversationNotFound);
        return;
      }
      onOpenConversation({
        conversation: {
          ...conv,
          photo_url: contact.photo_url ?? conv.photo_url,
          initials: contact.initials ?? conv.initials,
        },
      });
    },
    [botId, onOpenConversation],
  );

  const data = searchActive ? searchItems : items;

  let body: React.JSX.Element;
  if (loading && data.length === 0 && !searchActive) {
    body = (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  } else if (error && data.length === 0 && !searchActive) {
    body = (
      <Pressable onPress={() => fireAndForget(load())} style={styles.center}>
        <EmptyScreen title={error} subtitle={t.listRetry} />
      </Pressable>
    );
  } else if (data.length === 0) {
    body = searching ? (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    ) : (
      <EmptyScreen
        title={searchActive ? t.listEmptySearch : t.listEmpty}
        subtitle={searchActive ? '' : t.listEmptySubtitle}
      />
    );
  } else {
    body = (
      <FlatList
        data={data}
        keyExtractor={c => c.id}
        renderItem={({item}) => (
          <ContactListItem contact={item} onPress={onPressContact} />
        )}
        refreshing={loading && !searchActive}
        onRefresh={() => fireAndForget(load())}
        onEndReached={() => {
          if (!searchActive) fireAndForget(loadMore());
        }}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          loadingMore ? (
            <ActivityIndicator
              color={colors.accent}
              style={styles.footerSpinner}
            />
          ) : null
        }
      />
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      {offline ? (
        <View style={[styles.banner, {backgroundColor: colors.bgTertiary}]}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize.listSubtitle,
            }}>
            {t.listOfflineBanner}
          </Text>
        </View>
      ) : null}
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder={t.listSearchPlaceholder}
        onClear={() => setQuery('')}
      />
      {notice ? (
        <Text style={[styles.notice, {color: colors.danger}]}>{notice}</Text>
      ) : null}
      {body}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  banner: {padding: cmx.offlinePad, alignItems: 'center'},
  notice: {padding: cmx.noticePad, fontSize: fontSize.listSubtitle},
  footerSpinner: {margin: cmx.footerSpinnerMargin},
});
