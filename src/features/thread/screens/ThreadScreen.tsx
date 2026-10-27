/**
 * Fil de messages — lecture + envoi (L5c + L5d).
 * FlatList inversée : index 0 = plus récent.
 */
import React, {useCallback, useMemo} from 'react';
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
import {ComposerBar} from '../components/ComposerBar';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import type {Message} from '../../../core/realtime/events';

type Props = {
  conversationId: string;
  title?: string;
  photoUrl?: string | null;
  initials?: string | null;
  onBack: () => void;
  onPressAvatar?: () => void;
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
  onPressAvatar,
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
  const send = useThreadStore(s => s.send);
  const sendMedia = useThreadStore(s => s.sendMedia);
  const retry = useThreadStore(s => s.retry);
  const resendAsNew = useThreadStore(s => s.resendAsNew);
  const resendMedia = useThreadStore(s => s.resendMedia);
  const deleteOutgoing = useThreadStore(s => s.deleteOutgoing);
  const resendSameId = useThreadStore(s => s.resendSameId);
  const sending = useThreadStore(s => s.sending);
  const sendError = useThreadStore(s => s.sendError);

  React.useEffect(() => {
    open({conversationId, title, photoUrl, initials});
    return () => {
      close();
    };
  }, [conversationId, title, photoUrl, initials, open, close]);

  const rows = useMemo(() => buildInvertedRows(items), [items]);

  const onRetryMsg = useCallback(
    (m: Message) => retry(m.id),
    [retry],
  );

  const renderItem = useCallback(
    ({item}: {item: Row}) => {
      if (item.type === 'day') {
        return <DaySeparator timestamp={item.ts} />;
      }
      return (
        <MessageBubble
          message={item.message}
          onRetry={onRetryMsg}
          onResendSame={resendSameId}
          onResendNew={resendAsNew}
          onResendMedia={resendMedia}
          onDelete={deleteOutgoing}
        />
      );
    },
    [onRetryMsg, resendSameId, resendAsNew, resendMedia, deleteOutgoing],
  );

  const headerTitle = storeTitle || title || '';

  return (
    <View style={[styles.root, {backgroundColor: colors.bgChat}]}>
      <ThreadHeader
        title={headerTitle}
        photoUrl={photoUrl}
        initials={initials}
        onBack={onBack}
        onPressAvatar={onPressAvatar}
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
          data={rows}
          inverted
          keyExtractor={r => (r.type === 'day' ? r.key : r.message.id)}
          renderItem={renderItem}
          maintainVisibleContentPosition={{
            minIndexForVisible: tm.mvcMinIndex,
            autoscrollToTopThreshold: tm.mvcAutoscrollThreshold,
          }}
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
            !loading ? (
              <View style={styles.center}>
                <Text style={{color: colors.textSecondary}}>
                  {t.emptyTitle}
                </Text>
              </View>
            ) : undefined
          }
        />
      )}
      {sendError ? (
        <Text
          style={[
            styles.sendError,
            {color: colors.danger, fontSize: tm.retryBtnFont},
          ]}>
          {sendError}
        </Text>
      ) : null}
      <ComposerBar
        disabled={offline}
        sending={sending}
        onSend={send}
        onSendMedia={sendMedia}
      />
    </View>
  );
}

function buildInvertedRows(items: Message[]): Row[] {
  if (items.length === 0) return [];
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
  sendError: {
    textAlign: 'center',
    padding: tm.composerPad,
  },
});
