import React from 'react';
import {View, Text, Pressable, StyleSheet, Linking} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import type {InlineButton} from '../../../core/realtime/events';
import {safeHref} from '../../../core/utils/parseFormattedText';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {rows: InlineButton[][]};

export function InlineButtons({rows}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      {rows.map((row, ri) => (
        <View key={ri} style={styles.row}>
          {row.map((btn, bi) => {
            const href = safeHref(btn.url);
            const isUrl = Boolean(href);
            return (
              <Pressable
                key={bi}
                disabled={!isUrl}
                onPress={() => {
                  if (href) fireAndForget(Linking.openURL(href));
                }}
                style={[
                  styles.btn,
                  isUrl ? styles.btnEnabled : styles.btnDisabled,
                  {
                    backgroundColor: isUrl
                      ? colors.accentSoft
                      : colors.bgTertiary,
                  },
                ]}>
                <Text
                  style={{
                    color: isUrl ? colors.accent : colors.textSecondary,
                    fontSize: tm.btnFont,
                  }}
                  numberOfLines={1}>
                  {btn.text}
                </Text>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {marginTop: tm.btnMarginT, gap: tm.btnGap},
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: tm.btnGap},
  btn: {
    paddingVertical: tm.btnPadV,
    paddingHorizontal: tm.btnPadH,
    borderRadius: tm.btnRadius,
  },
});
