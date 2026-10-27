import React, {useCallback} from 'react';
import {
  View,
  FlatList,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {EmptyScreen} from '../../../shared/components/EmptyScreen';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t} from '../texts';
import {ConversationRow} from './ConversationRow';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

type Props = {
  filtered: ConversationSummary[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  searchQuery: string;
  densityPad: number;
  onRetry: () => void;
  onLoadMore: () => void;
  onOpen?: (id: string) => void;
  /** Photo de profil → écran contact. */
  onOpenProfile?: (id: string) => void;
  onPin?: (id: string, pinned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<boolean>;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  isArchived?: (id: string) => boolean;
  swipeAction?: 'archive' | 'folder' | 'pin';
};

export function ConversationsBody({
  filtered,
  loading,
  loadingMore,
  error,
  searchQuery,
  densityPad,
  onRetry,
  onLoadMore,
  onOpen,
  onOpenProfile,
  onPin,
  onDelete,
  onArchive,
  onUnarchive,
  isArchived,
  swipeAction,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const hideBadge = searchQuery.trim().length >= 1;

  const renderItem = useCallback(
    ({item}: {item: ConversationSummary}) => (
      <ConversationRow
        item={item}
        densityPad={densityPad}
        hideBadge={hideBadge}
        onPress={() => onOpen?.(item.id)}
        onPressAvatar={() => onOpenProfile?.(item.id)}
        onPin={onPin}
        onDelete={onDelete}
        onArchive={onArchive}
        onUnarchive={onUnarchive}
        archived={isArchived?.(item.id) ?? false}
        swipeAction={swipeAction}
      />
    ),
    [
      densityPad,
      hideBadge,
      onOpen,
      onOpenProfile,
      onPin,
      onDelete,
      onArchive,
      onUnarchive,
      isArchived,
      swipeAction,
    ],
  );

  if (loading && filtered.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }
  if (error && filtered.length === 0) {
    return (
      <Pressable onPress={onRetry} style={styles.center}>
        <EmptyScreen title={error} subtitle={t.retry} />
      </Pressable>
    );
  }
  if (filtered.length === 0) {
    return (
      <EmptyScreen
        title={searchQuery ? t.emptySearch : t.emptyTitle}
        subtitle={searchQuery ? '' : t.emptySubtitle}
      />
    );
  }
  return (
    <FlatList
      data={filtered}
      keyExtractor={item => item.id}
      renderItem={renderItem}
      onEndReached={() => {
        if (!searchQuery) onLoadMore();
      }}
      onEndReachedThreshold={0.4}
      ListFooterComponent={
        loadingMore ? (
          <ActivityIndicator
            color={colors.accent}
            style={styles.footerSpinner}
          />
        ) : undefined
      }
    />
  );
}

const styles = StyleSheet.create({
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  footerSpinner: {margin: cm.footerSpinnerMargin},
});
