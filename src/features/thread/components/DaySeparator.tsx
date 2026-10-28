import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {formatDayLabel} from '../texts';

type Props = {timestamp: number};

/** Pastille lisible sur n'importe quel fond d'écran. */
export function DaySeparator({timestamp}: Props): React.JSX.Element {
  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Text style={styles.label}>{formatDayLabel(timestamp)}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    paddingVertical: tm.daySepPadV,
  },
  pill: {
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  label: {color: '#ffffff', fontSize: tm.daySepFont},
});
