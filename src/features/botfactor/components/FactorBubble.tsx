import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import type {FactorMessage} from '../types';

export function FactorBubble({message}: {message: FactorMessage}): React.JSX.Element {
  const {colors} = useTheme();
  const mine = message.from === 'me';
  return (
    <View style={[styles.row, mine ? styles.right : styles.left]}>
      <View
        style={[
          styles.bubble,
          {backgroundColor: mine ? colors.accent : colors.bgTertiary},
        ]}>
        <Text
          selectable
          style={[styles.text, {color: mine ? colors.white : colors.textPrimary}]}>
          {message.text}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row'},
  left: {justifyContent: 'flex-start'},
  right: {justifyContent: 'flex-end'},
  bubble: {
    maxWidth: bm.bubbleMaxWidth,
    paddingHorizontal: bm.bubblePadH,
    paddingVertical: bm.bubblePadV,
    borderRadius: bm.bubbleRadius,
  },
  text: {fontSize: bm.bubbleFont, lineHeight: bm.bubbleLineHeight},
});
