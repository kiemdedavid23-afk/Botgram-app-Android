import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions, Pressable, Alert} from 'react-native';
import {useTheme, useChatTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import type {Message} from '../../../core/realtime/events';
import {FormattedText} from './FormattedText';
import {InlineButtons} from './InlineButtons';
import {formatMessageTime, kindLabel} from '../texts';
import {MessageStatus} from './MessageStatus';
import {MediaPhoto} from './MediaPhoto';
import {MediaFile} from './MediaFile';
import {MediaAlbum} from './MediaAlbum';
import {MediaVideo} from './MediaVideo';
import {MediaAudio} from './MediaAudio';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {threadTexts as t} from '../texts';

type Props = {
  message: Message;
  onRetry?: (m: Message) => Promise<void>;
  onResendSame?: (m: Message) => Promise<void>;
  onResendNew?: (m: Message) => Promise<void>;
  onResendMedia?: (m: Message) => Promise<void>;
  onDelete?: (m: Message) => Promise<void>;
};

export function MessageBubble({message, onRetry, onResendSame, onResendNew, onResendMedia, onDelete}: Props): React.JSX.Element {
  const {appearance} = useTheme();
  const chat = useChatTheme();
  const {width} = useWindowDimensions();
  const isOut = message.direction === 'out';
  const bubbleBg = isOut ? chat.bubbleOut : chat.bubbleIn;
  const textColor = isOut ? chat.bubbleOutText : chat.bubbleInText;
  const timeColor = isOut ? chat.timeOut : chat.timeIn;
  const ts = message.created_at ?? message.sent_at ?? undefined;
  const isText = message.kind === 'text' || !message.kind;
  const caption = message.text;
  const isLocal = message.id.startsWith('local:');
  const isVideoKind =
    message.kind === 'video' ||
    message.kind === 'animation' ||
    message.kind === 'video_note';
  const isAudioKind = message.kind === 'audio' || message.kind === 'voice';

  const confirmDelete = () => {
    if (!onDelete || !isOut) return;
    Alert.alert(t.deleteMessageConfirmTitle, t.deleteMessageConfirmBody, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.deleteMessage,
        style: 'destructive',
        onPress: () => {
          fireAndForget(onDelete(message));
        },
      },
    ]);
  };

  return (
    <Pressable
      onLongPress={isOut ? confirmDelete : undefined}
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
            borderRadius: appearance.cornerRadius,
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
        {isVideoKind && !isLocal ? (
          <MediaVideo
            messageId={message.id}
            kind={message.kind}
            size={message.attachment?.size}
          />
        ) : null}
        {isAudioKind && !isLocal ? (
          <MediaAudio
            messageId={message.id}
            kind={message.kind}
            name={message.attachment?.name}
            size={message.attachment?.size}
            isOut={isOut}
          />
        ) : null}
        {(isVideoKind || isAudioKind) && isLocal ? (
          <Text style={{color: textColor, fontSize: tm.kindLabelSize}}>
            {message.attachment?.name ?? kindLabel(message.kind)}
          </Text>
        ) : null}
        {!isText &&
        message.kind !== 'photo' &&
        message.kind !== 'document' &&
        message.kind !== 'album' &&
        !isVideoKind &&
        !isAudioKind ? (
          <Text style={{color: textColor, fontSize: tm.kindLabelSize}}>
            {kindLabel(message.kind)}
          </Text>
        ) : null}
        {isText && caption ? (
          <FormattedText
            text={caption}
            parseMode={message.parse_mode}
            color={textColor}
            fontSize={appearance.fontSize}
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
            fontSize={appearance.fontSize}
          />
        ) : null}
        {message.buttons && message.buttons.length > 0 ? (
          <InlineButtons rows={message.buttons} />
        ) : null}
        <Text style={[styles.time, {color: timeColor}]}>
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
    </Pressable>
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
