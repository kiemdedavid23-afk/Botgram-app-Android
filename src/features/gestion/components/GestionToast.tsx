/**
 * Toast info 3,2 s — GestionPage toast.
 */
import React, {useEffect} from 'react';
import {Text, StyleSheet, Animated} from 'react-native';
import {useTheme, gestionMetrics as g} from '../../../shared/theme';

type Props = {message: string; onHide: () => void};

export function GestionToast({message, onHide}: Props): React.JSX.Element | null {
  const {colors} = useTheme();
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!message) return;
    Animated.sequence([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
      Animated.delay(g.toastDurationMs - 360),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start(({finished}) => {
      if (finished) onHide();
    });
  }, [message, onHide, opacity]);

  if (!message) return null;
  return (
    <Animated.View
      style={[
        styles.toast,
        {backgroundColor: colors.bgPrimary, opacity},
      ]}
      pointerEvents="none">
      <Text style={[styles.text, {color: colors.textPrimary}]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    left: g.scrollPadH,
    right: g.scrollPadH,
    bottom: 24,
    paddingVertical: g.toastPadV,
    paddingHorizontal: g.toastPadH,
    borderRadius: g.toastRadius,
    elevation: 4,
  },
  text: {fontSize: 14, fontWeight: '600', textAlign: 'center'},
});
