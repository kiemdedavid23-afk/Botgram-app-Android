import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import type {Message} from '../../../core/realtime/events';
import {FormattedText} from './FormattedText';
import {InlineButtons} from './InlineButtons';
import {formatMessageTime, kindLabel} from '../texts';
import {MessageStatus} from './MessageStatus';
import {MediaPhoto} from './MediaPhoto';
import {MediaFile} from './MediaFile';
import {MediaAlbum} from './MediaAlbum';

type Props = {
  message: Message;
  onRetry?: (m: Message) => Promise<void>;
  onResendSame?: (m: Message) => Promise<void>;
  onResendNew?: (m: Message) => Promise<void>;
  onResendMedia?: (m: Message) => Promise<void>;
};

export function MessageBubble({message, onRetry, onResendSame, onResendNew, onResendMedia}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const {width} = useWindowDimensions();
  const isOut = message.direction === 'out';
  const bubbleBg = isOut ? colors.bubbleOut : colors.bubbleIn;
  const textColor = isOut ? colors.bubbleOutText : colors.bubbleInText;
  const ts = message.created_at ?? message.sent_at ?? undefined;
  const isText = message.kind === 'text' || !message.kind;
  const caption = message.text;

  return (
    <View
      style={[
        styles.row,
        isOut ? styles.out : styles.in,
        {maxWidth: width * tm.bubbleMaxWidthPct},
      ]}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: bubbleBg,
            borderRadius: tm.bubbleRadius,
          },
        ]}>
        {message.kind === 'photo' ? (
          <MediaPhoto
            messageId={message.id}
            size={message.attachment?.size}
            caption={caption}
          />
        ) : null}
        {message.kind === 'document' ? (
          <MediaFile
            messageId={message.id}
            name={message.attachment?.name}
            size={message.attachment?.size}
            mime={message.attachment?.mime}
          />
        ) : null}
        {message.kind === 'album' && message.album && message.album.length > 0 ? (
          <MediaAlbum
            items={message.album}
            caption={caption}
            parseMode={message.parse_mode}
          />
        ) : null}
        {!isText &&
        message.kind !== 'photo' &&
        message.kind !== 'document' &&
        message.kind !== 'album' ? (
          <Text style={{color: textColor, fontSize: tm.kindLabelSize}}>
            {kindLabel(message.kind)}
          </Text>
        ) : null}
        {isText && caption ? (
          <FormattedText
            text={caption}
            parseMode={message.parse_mode}
            color={textColor}
          />
        ) : null}
        {!isText &&
        message.kind !== 'photo' &&
        message.kind !== 'album' &&
        caption ? (
          <FormattedText
            text={caption}
            parseMode={message.parse_mode}
            color={textColor}
          />
        ) : null}
        {message.buttons && message.buttons.length > 0 ? (
          <InlineButtons rows={message.buttons} />
        ) : null}
        <Text style={[styles.time, {color: colors.textHint}]}>
          {formatMessageTime(ts)}
        </Text>
        {isOut && onRetry && onResendSame && onResendNew && onResendMedia ? (
          <MessageStatus
            message={message}
            onRetry={onRetry}
            onResendSame={onResendSame}
            onResendNew={onResendNew}
            onResendMedia={onResendMedia}
          />
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {marginVertical: tm.listGap / 2},
  in: {alignSelf: 'flex-start'},
  out: {alignSelf: 'flex-end'},
  bubble: {
    paddingTop: tm.bubblePadT,
    paddingHorizontal: tm.bubblePadH,
    paddingBottom: tm.bubblePadB,
  },
  time: {
    fontSize: tm.timeSize,
    alignSelf: 'flex-end',
    marginTop: tm.timeMarginT,
  },
});
