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
  KeyboardAvoidingView,
} from 'react-native';
import {useTheme, useChatTheme} from '../../../shared/theme';
import {GradientView} from '../../../shared/components/GradientView';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {useThreadStore} from '../store/threadStore';
import {messageTimestamp} from '../store/mergeMessages';
import {MessageBubble} from '../components/MessageBubble';
import {DaySeparator} from '../components/DaySeparator';
import {ThreadHeader, useThreadHeaderHeight} from '../components/ThreadHeader';
import {ThreadMenu} from '../components/ThreadMenu';
import {useConversationsStore} from '../../conversations/store/conversationsStore';
import {useArchiveStore} from '../../conversations/store/archiveStore';
import {
  confirmDeleteConversation,
  conversationSubtitle,
} from '../../conversations/components/conversationMenu';
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
  const chat = useChatTheme();
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
  const sendContact = useThreadStore(s => s.sendContact);
  const sendLocation = useThreadStore(s => s.sendLocation);
  const sendLiveLocation = useThreadStore(s => s.sendLiveLocation);
  const retry = useThreadStore(s => s.retry);
  const resendAsNew = useThreadStore(s => s.resendAsNew);
  const resendMedia = useThreadStore(s => s.resendMedia);
  const deleteOutgoing = useThreadStore(s => s.deleteOutgoing);
  const resendSameId = useThreadStore(s => s.resendSameId);
  const sending = useThreadStore(s => s.sending);
  const sendError = useThreadStore(s => s.sendError);

  // Menu ⋮ : état et actions de la conversation (stores existants).
  const conversation = useConversationsStore(s =>
    s.items.find(c => c.id === conversationId),
  );
  const pinConversation = useConversationsStore(s => s.pinConversation);
  const deleteConversation = useConversationsStore(s => s.deleteConversation);
  const archived = useArchiveStore(s => !!s.ids[conversationId]);
  const archiveConv = useArchiveStore(s => s.archive);
  const unarchiveConv = useArchiveStore(s => s.unarchive);
  const headerHeight = useThreadHeaderHeight(offline);

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
  const subtitle = conversationSubtitle(conversation);

  const onTogglePin = useCallback(() => {
    fireAndForget(pinConversation(conversationId, !conversation?.pinned));
  }, [pinConversation, conversationId, conversation?.pinned]);

  const onToggleArchive = useCallback(() => {
    if (archived) {
      unarchiveConv(conversationId);
      return;
    }
    archiveConv(conversationId);
    onBack(); // la conversation quitte la liste principale
  }, [archived, archiveConv, unarchiveConv, conversationId, onBack]);

  const onDeleteConversation = useCallback(() => {
    confirmDeleteConversation(() => {
      fireAndForget(
        deleteConversation(conversationId).then(ok => {
          if (ok) onBack();
        }),
      );
    });
  }, [deleteConversation, conversationId, onBack]);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgChat}]}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <GradientView
          colors={[...chat.wallpaperColors]}
          angle={160}
          style={StyleSheet.absoluteFill}
        />
        {chat.dim ? <View style={[StyleSheet.absoluteFill, styles.dim]} /> : null}
      </View>
      {/*
        Clavier : seul le premier plan (en-tête flottant, messages, barre de saisie) remonte,
        et uniquement quand le clavier est ouvert. Le fond d'écran reste derrière, jamais
        redimensionné. En mode bord à bord, Android ne rétrécit plus la fenêtre : sans ceci,
        le clavier recouvre la barre de saisie. 'padding' se base sur le chevauchement réel
        clavier/écran, donc rien n'est ajouté quand le clavier est fermé.
      */}
      <KeyboardAvoidingView style={styles.avoid} behavior="padding">
        <ThreadHeader
          title={headerTitle}
          subtitle={subtitle}
          photoUrl={photoUrl}
          initials={initials}
          offline={offline}
          onBack={onBack}
          onPressAvatar={onPressAvatar}
          right={
            <ThreadMenu
              pinned={!!conversation?.pinned}
              archived={archived}
              offline={offline}
              onViewProfile={onPressAvatar}
              onTogglePin={onTogglePin}
              onToggleArchive={onToggleArchive}
              onDelete={onDeleteConversation}
            />
          }
        />
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
            contentContainerStyle={[
              styles.listContent,
              {paddingBottom: tm.listPadT + headerHeight},
            ]}
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
          onSendContact={sendContact}
          onSendLocation={sendLocation}
          onSendLiveLocation={sendLiveLocation}
        />
      </KeyboardAvoidingView>
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
  avoid: {flex: 1},
  dim: {backgroundColor: 'rgba(0,0,0,0.45)'},
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
