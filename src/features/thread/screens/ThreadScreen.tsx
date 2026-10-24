/**
 * Fil de messages — lecture seule (L5c).
 * FlatList inversée : index 0 = plus récent (bas de l'écran).
 */
import React, {useCallback, useMemo, useRef, useState} from 'react';
import {
  View,
  FlatList,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {useTheme, fontSize} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {useThreadStore} from '../store/threadStore';
import {messageTimestamp} from '../store/mergeMessages';
import {MessageBubble} from '../components/MessageBubble';
import {DaySeparator} from '../components/DaySeparator';
import {ThreadHeader} from '../components/ThreadHeader';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {Message} from '../../../core/realtime/events';

type Props = {
  conversationId: string;
  title?: string;
  photoUrl?: string | null;
  initials?: string | null;
  onBack: () => void;
};

type Row =
  | {type: 'msg'; message: Message}
  | {type: 'day'; key: string; ts: number};

export function ThreadScreen({
  conversationId,
  title,
  photoUrl,
  initials,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const open = useThreadStore(s => s.open);
  const close = useThreadStore(s => s.close);
  const items = useThreadStore(s => s.items);
  const loading = useThreadStore(s => s.loading);
  const loadingOlder = useThreadStore(s => s.loadingOlder);
  const offline = useThreadStore(s => s.offline);
  const storeTitle = useThreadStore(s => s.title);
  const loadOlder = useThreadStore(s => s.loadOlder);
  const nearBottomRef = useRef(true);
  const listRef = useRef<FlatList<Row>>(null);
  const [opened, setOpened] = useState(false);

  React.useEffect(() => {
    open({conversationId, title, photoUrl, initials});
    setOpened(true);
    return () => {
      close();
    };
  }, [conversationId, title, photoUrl, initials, open, close]);

  // Liste inversée : data[0] = plus récent
  const rows = useMemo(() => buildInvertedRows(items), [items]);

  const onScroll = useCallback(
    (e: {nativeEvent: {contentOffset: {y: number}}}) => {
      // inverted : offset proche de 0 = bas (messages récents)
      nearBottomRef.current = e.nativeEvent.contentOffset.y < 80;
    },
    [],
  );

  const renderItem = useCallback(({item}: {item: Row}) => {
    if (item.type === 'day') {
      return <DaySeparator timestamp={item.ts} />;
    }
    return <MessageBubble message={item.message} />;
  }, []);

  const headerTitle = storeTitle || title || '';

  return (
    <View style={[styles.root, {backgroundColor: colors.bgChat}]}>
      <ThreadHeader
        title={headerTitle}
        photoUrl={photoUrl}
        initials={initials}
        onBack={onBack}
      />
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
      {loading && items.length === 0 ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <FlatList
          ref={listRef}
          data={rows}
          inverted
          keyExtractor={r => (r.type === 'day' ? r.key : r.message.id)}
          renderItem={renderItem}
          onScroll={onScroll}
          scrollEventThrottle={32}
          onEndReached={() => {
            fireAndForget(loadOlder());
          }}
          onEndReachedThreshold={0.3}
          contentContainerStyle={styles.listContent}
          ListFooterComponent={
            loadingOlder ? (
              <ActivityIndicator color={colors.accent} style={styles.older} />
            ) : undefined
          }
          ListEmptyComponent={
            opened && !loading ? (
              <View style={styles.center}>
                <Text style={{color: colors.textSecondary}}>
                  {t.emptyTitle}
                </Text>
              </View>
            ) : undefined
          }
        />
      )}
    </View>
  );
}

/** Construit des lignes inversées (index 0 = plus récent). */
function buildInvertedRows(items: Message[]): Row[] {
  if (items.length === 0) return [];
  // items déjà triés asc — on produit rows asc puis on inverse
  const asc: Row[] = [];
  let lastDay = '';
  for (const m of items) {
    const ts = messageTimestamp(m);
    const dayKey = new Date(ts).toDateString();
    if (dayKey !== lastDay) {
      lastDay = dayKey;
      asc.push({type: 'day', key: `day-${dayKey}`, ts});
    }
    asc.push({type: 'msg', message: m});
  }
  return asc.reverse();
}

const styles = StyleSheet.create({
  root: {flex: 1},
  offline: {padding: tm.offlinePad, alignItems: 'center'},
  center: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  listContent: {
    paddingTop: tm.listPadB,
    paddingBottom: tm.listPadT,
    paddingHorizontal: tm.listPadH,
  },
  older: {marginVertical: tm.olderSpinnerMargin},
});
