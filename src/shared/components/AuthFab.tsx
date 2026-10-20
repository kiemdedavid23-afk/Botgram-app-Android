import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {authColors, authMetrics} from '../theme/authColors';

type Props = {onPress: () => void; disabled?: boolean};

export function AuthFab({onPress, disabled}: Props): React.JSX.Element {
  return (
    <Pressable
      style={[styles.fab, disabled && styles.disabled]}
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button">
      <ArrowRight size={26} color={authColors.white} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: authMetrics.fabRight,
    bottom: authMetrics.fabBottom,
    width: authMetrics.fabSize,
    height: authMetrics.fabSize,
    borderRadius: authMetrics.fabSize / 2,
    backgroundColor: authColors.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: authColors.fabShadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
  disabled: {opacity: 0.5},
});
