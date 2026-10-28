/**
 * Curseur horizontal glissable (piste bleue / grise, pastille bleue).
 * Remplace les boutons − / + : le doigt règle directement la valeur.
 */
import React, {useRef, useState} from 'react';
import {
  View,
  PanResponder,
  StyleSheet,
  type LayoutChangeEvent,
  type AccessibilityActionEvent,
} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {positionToValue, valueToRatio, clamp} from './sliderMath';

type Props = {
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
  accessibilityLabel: string;
};

const THUMB = 24;
const TRACK = 4;
const HIT = 44;

export function SettingsSlider({
  value,
  min,
  max,
  onChange,
  accessibilityLabel,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [width, setWidth] = useState(0);
  const live = useRef({width: 0, min, max, onChange});
  live.current = {width, min, max, onChange};
  const startX = useRef(0);

  const responder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false,
      onShouldBlockNativeResponder: () => true,
      onPanResponderGrant: e => {
        const l = live.current;
        startX.current = e.nativeEvent.locationX - THUMB / 2;
        l.onChange(positionToValue(startX.current, l.width - THUMB, l.min, l.max));
      },
      onPanResponderMove: (_e, g) => {
        const l = live.current;
        l.onChange(
          positionToValue(startX.current + g.dx, l.width - THUMB, l.min, l.max),
        );
      },
    }),
  ).current;

  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);
  const usable = Math.max(0, width - THUMB);
  const left = valueToRatio(value, min, max) * usable;

  const onAction = (e: AccessibilityActionEvent) => {
    const delta = e.nativeEvent.actionName === 'increment' ? 1 : -1;
    onChange(clamp(value + delta, min, max));
  };

  return (
    <View
      style={styles.hit}
      onLayout={onLayout}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{min, max, now: value}}
      accessibilityActions={[{name: 'increment'}, {name: 'decrement'}]}
      onAccessibilityAction={onAction}
      {...responder.panHandlers}>
      <View pointerEvents="none" style={StyleSheet.absoluteFill}>
        <View
          style={[
            styles.track,
            styles.trackFull,
            {backgroundColor: colors.bgTertiary},
          ]}
        />
        <View
          style={[
            styles.track,
            {backgroundColor: colors.accent, width: left + THUMB / 2},
          ]}
        />
        <View
          style={[styles.thumb, {backgroundColor: colors.accent, left}]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hit: {flex: 1, height: HIT, justifyContent: 'center'},
  track: {
    position: 'absolute',
    left: 0,
    top: (HIT - TRACK) / 2,
    height: TRACK,
    borderRadius: TRACK / 2,
  },
  trackFull: {right: 0},
  thumb: {
    position: 'absolute',
    top: (HIT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
