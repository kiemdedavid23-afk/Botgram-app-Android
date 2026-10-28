/**
 * Statut d'envoi + Réessayer / Renvoyer (texte ou média).
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet, Alert} from 'react-native';
import {useChatTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import type {Message} from '../../../core/realtime/events';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {hasPendingMedia} from '../store/sendMediaActions';

type Props = {
  message: Message;
  onRetry: (m: Message) => Promise<void>;
  onResendSame: (m: Message) => Promise<void>;
  onResendNew: (m: Message) => Promise<void>;
  onResendMedia: (m: Message) => Promise<void>;
};

function statusLabel(status: string | undefined): string {
  switch (status) {
    case 'sending':
      return t.statusSending;
    case 'queued':
      return t.statusQueued;
    case 'sent':
      return t.statusSent;
    case 'failed':
      return t.statusFailed;
    case 'unknown':
      return t.statusUnknown;
    default:
      return '';
  }
}

function useRetryCountdown(message: Message): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!message.retryable || !message.retry_at) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [message.retryable, message.retry_at]);
  if (!message.retry_at || message.retry_at <= now) return 0;
  return Math.ceil((message.retry_at - now) / 1000);
}

function confirmUnknownResend(
  message: Message,
  onResendNew: (m: Message) => Promise<void>,
): void {
  Alert.alert(t.resend, t.unknownResendWarn, [
    {text: t.cancel, style: 'cancel'},
    {
      text: t.confirmResend,
      onPress: () => {
        fireAndForget(onResendNew(message));
      },
    },
  ]);
}

export function MessageStatus({
  message,
  onRetry,
  onResendSame,
  onResendNew,
  onResendMedia,
}: Props): React.JSX.Element | null {
  const chat = useChatTheme();
  const waitS = useRetryCountdown(message);
  const labelStyle = {
    color: chat.bubbleOutText,
    fontSize: tm.retryBtnFont,
    fontWeight: '700' as const,
    textDecorationLine: 'underline' as const,
  };
  const isText = message.kind === 'text';
  const isMediaFailed =
    !isText &&
    message.direction === 'out' &&
    message.status === 'failed';
  const canResendMedia =
    isMediaFailed && hasPendingMedia(message.id);

  if (message.direction !== 'out') return null;
  if (!message.status || message.status === 'received') return null;

  return (
    <View style={styles.row}>
      <Text style={{color: chat.timeOut, fontSize: tm.retryBtnFont}}>
        {statusLabel(message.status)}
      </Text>
      {isText && message.retryable ? (
        <Pressable
          onPress={() => fireAndForget(onRetry(message))}
          disabled={waitS > 0}
          style={[
            styles.btn,
            waitS > 0 ? styles.retryWaiting : styles.retryReady,
          ]}>
          <Text style={labelStyle}>
            {waitS > 0 ? t.retryIn(waitS) : t.retry}
          </Text>
        </Pressable>
      ) : null}
      {isText &&
      message.status === 'failed' &&
      !message.retryable &&
      message.error_code === 'local_network' ? (
        <Pressable
          onPress={() => fireAndForget(onResendSame(message))}
          style={styles.btn}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
      {isText && message.status === 'unknown' ? (
        <Pressable
          onPress={() => {
            confirmUnknownResend(message, onResendNew);
          }}
          style={styles.btn}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
      {isText &&
      message.status === 'failed' &&
      !message.retryable &&
      message.error_code !== 'local_network' ? (
        <Pressable
          onPress={() => fireAndForget(onResendNew(message))}
          style={styles.btn}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
      {canResendMedia ? (
        <Pressable
          onPress={() => fireAndForget(onResendMedia(message))}
          style={styles.btn}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
      {isMediaFailed && !canResendMedia ? (
        <Text style={{color: chat.timeOut, fontSize: tm.retryBtnFont}}>
          {t.mediaResendPickAgain}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.statusGap,
    marginTop: tm.statusMarginT,
  },
  btn: {
    paddingVertical: tm.retryBtnPadV,
    paddingHorizontal: tm.retryBtnPadH,
    borderRadius: tm.retryBtnRadius,
  },
  retryReady: {opacity: tm.retryReadyOpacity},
  retryWaiting: {opacity: tm.retryWaitingOpacity},
});
