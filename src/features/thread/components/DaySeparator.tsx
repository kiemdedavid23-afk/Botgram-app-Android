import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {formatDayLabel} from '../texts';

type Props = {timestamp: number};

export function DaySeparator({timestamp}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      <Text style={{color: colors.textSecondary, fontSize: tm.daySepFont}}>
        {formatDayLabel(timestamp)}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: tm.daySepPadV,
  },
});
