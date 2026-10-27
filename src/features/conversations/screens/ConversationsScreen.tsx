/**
 * Liste des conversations — onglet Échanges (L5b).
 * Abonnement realtime et setBotId : niveau app (useRealtimeLifecycle).
 */
import React, {useMemo, type ReactNode} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {View, Text, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme, fontSize} from '../../../shared/theme';
import {BrandBar} from '../../../shared/components/BrandBar';
import {SearchBar} from '../../../shared/components/SearchBar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
} from '../store/conversationsStore';
import {conversationsTexts as t} from '../texts';
import {FoldersBar} from '../components/FoldersBar';
import {ConversationsBody} from '../components/ConversationsBody';
import {useConversationSearch} from '../hooks/useConversationSearch';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  onOpenConversation?: (id: string) => void;
  /** Contenu à droite de la barre de marque (avatar de bascule). */
  headerRight?: ReactNode;
};

export function ConversationsScreen({
  onOpenConversation,
  headerRight,
}: Props): React.JSX.Element {
  const {colors, appearance} = useTheme();
  const densityPad =
    appearance.listDensity === 'three'
      ? cm.densityThreeExtra
      : cm.densityTwoExtra;

  const load = useConversationsStore(s => s.load);
  const loadMore = useConversationsStore(s => s.loadMore);
  const loading = useConversationsStore(s => s.loading);
  const loadingMore = useConversationsStore(s => s.loadingMore);
  const error = useConversationsStore(s => s.error);
  const offline = useConversationsStore(s => s.offline);
  const folder = useConversationsStore(s => s.folder);
  const setFolder = useConversationsStore(s => s.setFolder);
  const items = useConversationsStore(s => s.items);
  // useShallow : le sélecteur renvoie un nouveau tableau (filter) pour les
  // dossiers Personnel / Travail / Non lus ; sans lui, boucle de rendu infinie.
  const filtered = useConversationsStore(useShallow(selectFilteredItems));
  const pinConversation = useConversationsStore(s => s.pinConversation);
  const deleteConversation = useConversationsStore(s => s.deleteConversation);
  const counts = useMemo(() => folderCounts(items), [items]);
  const {searchQuery, searching, onSearchChange, clearSearch} =
    useConversationSearch();

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      <BrandBar title={t.title} right={headerRight} />
      {offline ? (
        <View style={[styles.offline, {backgroundColor: colors.bgTertiary}]}>
          <Text
            style={{
              color: colors.textSecondary,
              fontSize: fontSize.listSubtitle,
            }}>
            {t.offlineBanner}
          </Text>
        </View>
      ) : null}
      <SearchBar
        value={searchQuery}
        onChangeText={onSearchChange}
        placeholder={t.searchPlaceholder}
        onClear={clearSearch}
      />
      <FoldersBar folder={folder} counts={counts} onSelect={setFolder} />
      <ConversationsBody
        onPin={pinConversation}
        onDelete={deleteConversation}
        filtered={filtered}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        searchQuery={searchQuery}
        densityPad={densityPad}
        onRetry={() => fireAndForget(load(true))}
        onLoadMore={() => fireAndForget(loadMore())}
        onOpen={onOpenConversation}
      />
      {searching ? (
        <View style={styles.searching}>
          <ActivityIndicator color={colors.accent} size="small" />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  offline: {padding: cm.offlinePad, alignItems: 'center'},
  searching: {
    position: 'absolute',
    right: cm.searchingOffset,
    bottom: cm.searchingOffset,
  },
});
