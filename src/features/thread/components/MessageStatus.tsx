/**
 * Statut message sortant + Réessayer / Renvoyer (L5d).
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {
  Clock,
  Check,
  AlertCircle,
  HelpCircle,
  Loader,
} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {statusLabel, threadTexts as t} from '../texts';
import type {Message} from '../../../core/realtime/events';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  message: Message;
  onRetry: (id: string) => Promise<void>;
  onResendSame: (m: Message) => Promise<void>;
  onResendNew: (m: Message) => Promise<void>;
};

export function MessageStatus(props: Props): React.JSX.Element | null {
  const {message} = props;
  const {colors} = useTheme();
  const status = message.status;
  const waitS = useRetryWait(message);

  if (message.direction !== 'out' || !status) return null;
  const Icon = iconFor(status);
  return (
    <View style={styles.row}>
      <Icon size={tm.statusIconSize} color={colors.textHint} strokeWidth={2} />
      <Text style={{color: colors.textHint, fontSize: tm.retryBtnFont}}>
        {statusLabel(status, message.error_code)}
      </Text>
      <StatusActions {...props} waitS={waitS} />
    </View>
  );
}

function useRetryWait(message: Message): number {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!message.retryable || !message.retry_at) return undefined;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [message.retryable, message.retry_at]);
  if (!message.retry_at || message.retry_at <= now) return 0;
  return Math.ceil((message.retry_at - now) / 1000);
}

function StatusActions({
  message,
  onRetry,
  onResendSame,
  onResendNew,
  waitS,
}: Props & {waitS: number}): React.JSX.Element {
  const {colors} = useTheme();
  const btnStyle = [styles.btn, {backgroundColor: colors.accentSoft}];
  const labelStyle = {color: colors.accent, fontSize: tm.retryBtnFont};
  return (
    <>
      {message.retryable ? (
        <Pressable
          disabled={waitS > 0}
          onPress={() => fireAndForget(onRetry(message.id))}
          style={[btnStyle, {opacity: waitS > 0 ? 0.5 : 1}]}>
          <Text style={labelStyle}>
            {waitS > 0 ? t.retryIn(waitS) : t.retry}
          </Text>
        </Pressable>
      ) : null}
      {message.status === 'failed' &&
      message.error_code === 'local_network' ? (
        <Pressable
          onPress={() => fireAndForget(onResendSame(message))}
          style={btnStyle}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
      {(message.status === 'failed' &&
        message.error_code !== 'local_network') ||
      message.status === 'unknown' ? (
        <Pressable
          onPress={() => fireAndForget(onResendNew(message))}
          style={btnStyle}>
          <Text style={labelStyle}>{t.resend}</Text>
        </Pressable>
      ) : null}
    </>
  );
}

function iconFor(status: string) {
  switch (status) {
    case 'sending':
      return Loader;
    case 'sent':
      return Check;
    case 'queued':
      return Clock;
    case 'unknown':
      return HelpCircle;
    default:
      return AlertCircle;
  }
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.statusGap,
    marginTop: tm.timeMarginT,
    flexWrap: 'wrap',
  },
  btn: {
    paddingVertical: tm.retryBtnPadV,
    paddingHorizontal: tm.retryBtnPadH,
    borderRadius: tm.retryBtnRadius,
  },
});
