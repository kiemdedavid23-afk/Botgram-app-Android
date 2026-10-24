/**
 * Liste des conversations — onglet Échanges (L5b).
 */
import React, {useCallback, useEffect, useMemo, useRef} from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme, fontWeight, fontSize} from '../../../shared/theme';
import {BrandBar} from '../../../shared/components/BrandBar';
import {EmptyScreen} from '../../../shared/components/EmptyScreen';
import {SearchBar} from '../../../shared/components/SearchBar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {getRealtimeTransport} from '../../../core/realtime';
import {useBotsStore} from '../../bots/store/botsStore';
import {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
} from '../store/conversationsStore';
import {conversationsTexts as t} from '../texts';
import {ConversationRow} from '../components/ConversationRow';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

type Props = {
  onOpenConversation?: (id: string) => void;
};

export function ConversationsScreen({
  onOpenConversation,
}: Props): React.JSX.Element {
  const {colors, appearance} = useTheme();
  const densityPad =
    appearance.listDensity === 'three'
      ? cm.densityThreeExtra
      : cm.densityTwoExtra;

  const bots = useBotsStore(s => s.bots);
  const selectedBot = useMemo(
    () => bots.find(b => b.selected) ?? bots[0] ?? null,
    [bots],
  );

  const setBotId = useConversationsStore(s => s.setBotId);
  const load = useConversationsStore(s => s.load);
  const loadMore = useConversationsStore(s => s.loadMore);
  const loading = useConversationsStore(s => s.loading);
  const loadingMore = useConversationsStore(s => s.loadingMore);
  const error = useConversationsStore(s => s.error);
  const offline = useConversationsStore(s => s.offline);
  const folder = useConversationsStore(s => s.folder);
  const setFolder = useConversationsStore(s => s.setFolder);
  const searchQuery = useConversationsStore(s => s.searchQuery);
  const setSearchQuery = useConversationsStore(s => s.setSearchQuery);
  const search = useConversationsStore(s => s.search);
  const clearSearch = useConversationsStore(s => s.clearSearch);
  const searching = useConversationsStore(s => s.searching);
  const items = useConversationsStore(s => s.items);
  const applyRealtimeEvent = useConversationsStore(s => s.applyRealtimeEvent);
  const filtered = useConversationsStore(selectFilteredItems);
  const counts = useMemo(() => folderCounts(items), [items]);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBotId(selectedBot?.id ?? null);
  }, [selectedBot?.id, setBotId]);

  useEffect(() => {
    return getRealtimeTransport().subscribe(ev => applyRealtimeEvent(ev));
  }, [applyRealtimeEvent]);

  const onSearchChange = useCallback(
    (q: string) => {
      setSearchQuery(q);
      if (searchTimer.current) clearTimeout(searchTimer.current);
      if (q.trim().length < 1) {
        clearSearch();
        return;
      }
      searchTimer.current = setTimeout(() => {
        void search(q);
      }, 300);
    },
    [setSearchQuery, clearSearch, search],
  );

  const renderItem = useCallback(
    ({item}: {item: ConversationSummary}) => (
      <ConversationRow
        item={item}
        densityPad={densityPad}
        hideBadge={searchQuery.trim().length >= 1}
        onPress={() => onOpenConversation?.(item.id)}
      />
    ),
    [densityPad, onOpenConversation, searchQuery],
  );

  const folders = [
    {id: 'all' as const, label: t.folderAll},
    {id: 'personal' as const, label: t.folderPersonal},
    {id: 'work' as const, label: t.folderWork},
    {id: 'unread' as const, label: t.folderUnread},
  ];

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      <BrandBar title={t.title} />
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
      <View
        style={{
          paddingTop: cm.foldersPaddingT,
          paddingHorizontal: cm.foldersPaddingH,
          paddingBottom: cm.foldersPaddingB,
        }}>
        <View
          style={[
            styles.foldersTrack,
            {
              backgroundColor: colors.bgSecondary,
              borderRadius: cm.foldersTrackRadius,
              padding: cm.foldersTrackPad,
            },
          ]}>
          {folders.map(f => {
            const active = folder === f.id;
            return (
              <Pressable
                key={f.id}
                onPress={() => setFolder(f.id)}
                style={[
                  styles.folderTab,
                  active && {backgroundColor: colors.accentSoft},
                ]}>
                <Text
                  style={{
                    color: active ? colors.accent : colors.textSecondary,
                    fontSize: cm.folderTabFont,
                    fontWeight: active
                      ? fontWeight.semibold
                      : fontWeight.medium,
                  }}>
                  {f.label}
                </Text>
                <View
                  style={[
                    styles.folderCount,
                    {
                      backgroundColor: active
                        ? colors.accent
                        : colors.bgTertiary,
                    },
                  ]}>
                  <Text
                    style={{
                      color: active ? colors.white : colors.textSecondary,
                      fontSize: cm.folderCountSize,
                      fontWeight: fontWeight.semibold,
                    }}>
                    {counts[f.id]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      </View>

      {loading && filtered.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error && filtered.length === 0 ? (
        <Pressable onPress={() => void load(true)} style={styles.center}>
          <EmptyScreen title={error} subtitle={t.retry} />
        </Pressable>
      ) : filtered.length === 0 ? (
        <EmptyScreen
          title={searchQuery ? t.emptySearch : t.emptyTitle}
          subtitle={searchQuery ? '' : t.emptySubtitle}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={item => item.id}
          renderItem={renderItem}
          onEndReached={() => {
            if (!searchQuery) void loadMore();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            loadingMore ? (
              <ActivityIndicator color={colors.accent} style={{margin: 12}} />
            ) : null
          }
        />
      )}
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
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  offline: {padding: cm.offlinePad, alignItems: 'center'},
  foldersTrack: {flexDirection: 'row', flexWrap: 'wrap'},
  folderTab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: cm.folderTabPadV,
    paddingHorizontal: cm.folderTabPadH,
    borderRadius: cm.folderTabRadius,
  },
  folderCount: {
    minWidth: cm.folderCountMin,
    height: cm.folderCountMin,
    paddingHorizontal: 5,
    borderRadius: cm.folderCountMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searching: {position: 'absolute', right: 16, bottom: 16},
});
