/**
 * Liste des conversations — onglet Échanges (L5b).
 * Abonnement realtime et setBotId : niveau app (useRealtimeLifecycle).
 */
import React, {useEffect, useMemo, type ReactNode} from 'react';
import {useShallow} from 'zustand/react/shallow';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  BackHandler,
  Alert,
} from 'react-native';
import {useTheme, fontSize} from '../../../shared/theme';
import {BrandBar} from '../../../shared/components/BrandBar';
import {SearchBar} from '../../../shared/components/SearchBar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
  conversationTitle,
} from '../store/conversationsStore';
import {useArchiveStore} from '../store/archiveStore';
import {useSelectionStore} from '../store/selectionStore';
import {
  archiveConversations,
  deleteConversations,
  markConversationsRead,
  pinConversations,
} from '../store/bulkActions';
import {SelectionBar} from '../components/SelectionBar';
import {applyArchiveVisibility} from '../store/filters';
import {conversationsTexts as t} from '../texts';
import {FoldersBar} from '../components/FoldersBar';
import {ArchiveRow, ArchiveHeader} from '../components/ArchivedBar';
import {ConversationsBody} from '../components/ConversationsBody';
import {useConversationSearch} from '../hooks/useConversationSearch';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {BotfactorRow} from '../../botfactor';

type Props = {
  onOpenConversation?: (id: string) => void;
  /** Appui sur la photo d'une ligne → profil contact. */
  onOpenProfile?: (id: string) => void;
  /** Contenu à droite de la barre de marque (avatar de bascule). */
  headerRight?: ReactNode;
};

export function ConversationsScreen({
  onOpenConversation,
  onOpenProfile,
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
  const baseFiltered = useConversationsStore(useShallow(selectFilteredItems));
  const pinConversation = useConversationsStore(s => s.pinConversation);
  const deleteConversation = useConversationsStore(s => s.deleteConversation);

  const archivedIds = useArchiveStore(s => s.ids);
  const hydrateArchive = useArchiveStore(s => s.hydrate);
  const archiveConv = useArchiveStore(s => s.archive);
  const unarchiveConv = useArchiveStore(s => s.unarchive);

  useEffect(() => {
    fireAndForget(hydrateArchive());
  }, [hydrateArchive]);

  const filtered = useMemo(
    () => applyArchiveVisibility(baseFiltered, folder, archivedIds),
    [baseFiltered, folder, archivedIds],
  );

  const counts = useMemo(
    () => folderCounts(items, archivedIds),
    [items, archivedIds],
  );

  const {searchQuery, searching, onSearchChange, clearSearch} =
    useConversationSearch();

  // Mode sélection (menu ⋮ « Sélectionner »).
  const selActive = useSelectionStore(s => s.active);
  const selIds = useSelectionStore(s => s.ids);
  const toggleSelect = useSelectionStore(s => s.toggle);
  const selectAll = useSelectionStore(s => s.selectAll);
  const exitSelection = useSelectionStore(s => s.exit);
  const botId = useConversationsStore(s => s.botId);
  const selectedList = useMemo(() => Object.keys(selIds), [selIds]);
  const selectedItems = useMemo(
    () => items.filter(c => !!selIds[c.id]),
    [items, selIds],
  );
  const allPinned =
    selectedItems.length > 0 && selectedItems.every(c => !!c.pinned);
  const allArchived =
    selectedList.length > 0 && selectedList.every(id => !!archivedIds[id]);

  // Changer de bot ou quitter l'onglet : on sort du mode sélection.
  useEffect(() => {
    exitSelection();
  }, [botId, exitSelection]);
  useEffect(() => exitSelection, [exitSelection]);

  // Retour Android : quitte d'abord le mode sélection.
  useEffect(() => {
    if (!selActive) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      exitSelection();
      return true;
    });
    return () => sub.remove();
  }, [selActive, exitSelection]);

  const onBulkPin = () => {
    const ids = selectedList;
    exitSelection();
    fireAndForget(pinConversations(ids, !allPinned));
  };
  const onBulkArchive = () => {
    archiveConversations(selectedList, !allArchived);
    exitSelection();
  };
  const onBulkDelete = () => {
    const ids = selectedList;
    Alert.alert(
      ids.length === 1
        ? t.deleteConversationConfirmTitle
        : t.deleteSelectedTitle(ids.length),
      t.deleteConversationConfirmBody,
      [
        {text: t.cancel, style: 'cancel'},
        {
          text: t.deleteConversationConfirm2,
          style: 'destructive',
          onPress: () => {
            exitSelection();
            fireAndForget(deleteConversations(ids));
          },
        },
      ],
    );
  };
  const onBulkMarkRead = () => {
    const ids = selectedList;
    exitSelection();
    fireAndForget(markConversationsRead(ids));
  };

  // Aperçu de la ligne « Échanges archivés » : noms des 3 premières conversations archivées.
  const archivedPreview = useMemo(
    () =>
      items
        .filter(c => !!archivedIds[c.id])
        .slice(0, 3)
        .map(c => conversationTitle(c))
        .join(', '),
    [items, archivedIds],
  );

  // Dans le dossier archive, le retour Android ramène à la liste principale.
  const inArchive = folder === 'archive';
  useEffect(() => {
    if (!inArchive) return undefined;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setFolder('all');
      return true;
    });
    return () => sub.remove();
  }, [inArchive, setFolder]);

  // Dernière conversation désarchivée : on quitte le dossier archive (il serait vide).
  const archivedCount = counts.archive;
  useEffect(() => {
    if (inArchive && archivedCount === 0) setFolder('all');
  }, [inArchive, archivedCount, setFolder]);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      {selActive ? (
        <SelectionBar
          count={selectedList.length}
          allPinned={allPinned}
          allArchived={allArchived}
          offline={offline}
          onExit={exitSelection}
          onPin={onBulkPin}
          onArchive={onBulkArchive}
          onDelete={onBulkDelete}
          onSelectAll={() => selectAll(filtered.map(c => c.id))}
          onMarkRead={onBulkMarkRead}
        />
      ) : (
        <BrandBar title={t.title} right={headerRight} seamless />
      )}
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
      {inArchive ? (
        <ArchiveHeader count={counts.archive} onBack={() => setFolder('all')} />
      ) : (
        <>
          <FoldersBar folder={folder} counts={counts} onSelect={setFolder} />
          {searchQuery.trim().length === 0 ? <BotfactorRow /> : null}
          {counts.archive > 0 && searchQuery.trim().length === 0 ? (
            <ArchiveRow
              count={counts.archive}
              preview={archivedPreview}
              onPress={() => setFolder('archive')}
            />
          ) : null}
        </>
      )}
      <ConversationsBody
        onPin={pinConversation}
        onDelete={deleteConversation}
        onArchive={id => archiveConv(id)}
        onUnarchive={id => unarchiveConv(id)}
        isArchived={id => !!archivedIds[id]}
        swipeAction={appearance.swipeAction}
        selectionMode={selActive}
        selectedIds={selIds}
        onToggleSelect={toggleSelect}
        filtered={filtered}
        loading={loading}
        loadingMore={loadingMore}
        error={error}
        searchQuery={searchQuery}
        densityPad={densityPad}
        onRetry={() => fireAndForget(load(true))}
        onLoadMore={() => fireAndForget(loadMore())}
        onOpen={onOpenConversation}
        onOpenProfile={onOpenProfile}
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
