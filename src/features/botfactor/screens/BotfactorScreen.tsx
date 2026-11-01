/** Conversation guidée avec Botfactor (modification du profil Telegram du bot). */
import React, {useEffect, useRef, useCallback} from 'react';
import {View, FlatList, StyleSheet, BackHandler, KeyboardAvoidingView, Platform} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import {FactorHeader} from '../components/FactorHeader';
import {FactorBubble} from '../components/FactorBubble';
import {QuickReplies} from '../components/QuickReplies';
import {FactorComposer} from '../components/FactorComposer';
import {openConversation, sendInput} from '../engine';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useBotfactorStore} from '../store/botfactorStore';
import {useBotfactorLauncher} from '../store/launcherStore';
import type {FactorMessage, QuickReply} from '../types';

type Props = {onBack: () => void};

export function BotfactorScreen({onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const listRef = useRef<FlatList<FactorMessage>>(null);
  const messages = useBotfactorStore(s => s.messages);
  const busy = useBotfactorStore(s => s.busy);
  const last = messages[messages.length - 1];
  const chips = last?.from === 'bot' ? last.actions : undefined;

  useEffect(() => {
    openConversation(useBotfactorLauncher.getState().consumePending());
  }, []);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      onBack();
      return true;
    });
    return () => sub.remove();
  }, [onBack]);

  const scrollEnd = useCallback(() => {
    listRef.current?.scrollToEnd({animated: true});
  }, []);

  const onPick = useCallback((q: QuickReply) => {
    fireAndForget(sendInput(q.value, q.label));
  }, []);

  return (
    <KeyboardAvoidingView
      style={[styles.root, {backgroundColor: colors.bgSecondary}]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FactorHeader onBack={onBack} />
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={m => m.id}
        renderItem={({item}) => <FactorBubble message={item} />}
        contentContainerStyle={styles.list}
        onContentSizeChange={scrollEnd}
        keyboardShouldPersistTaps="handled"
        ListFooterComponent={
          chips ? (
            <View style={styles.chips}>
              <QuickReplies actions={chips} disabled={busy} onPick={onPick} />
            </View>
          ) : null
        }
      />
      <FactorComposer busy={busy} onSend={t => fireAndForget(sendInput(t))} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  list: {
    paddingHorizontal: bm.listPadH,
    paddingVertical: bm.listPadV,
    gap: bm.listGap,
  },
  chips: {marginTop: bm.listGap},
});
