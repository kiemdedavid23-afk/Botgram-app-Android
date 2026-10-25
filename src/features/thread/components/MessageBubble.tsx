import React from 'react';
import {View, Text, StyleSheet, useWindowDimensions} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import type {Message} from '../../../core/realtime/events';
import {FormattedText} from './FormattedText';
import {InlineButtons} from './InlineButtons';
import {formatMessageTime, kindLabel} from '../texts';

type Props = {message: Message};

export function MessageBubble({message}: Props): React.JSX.Element {
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
        {!isText ? (
          <Text style={{color: textColor, fontSize: tm.kindLabelSize}}>
            {kindLabel(message.kind)}
          </Text>
        ) : null}
        {caption ? (
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
