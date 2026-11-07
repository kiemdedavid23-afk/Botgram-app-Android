import React, {useEffect, useRef} from 'react';
import {Animated} from 'react-native';
import {useReducedMotion} from '../../../../shared/hooks/useReducedMotion';

type Props = {index: number; children: React.ReactNode};

/** Entrée en cascade : léger glissement vers le haut, un bloc après l'autre. */
export function Rise({index, children}: Props): React.JSX.Element {
  const reduce = useReducedMotion();
  const v = useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) {
      v.setValue(1);
      return;
    }
    Animated.timing(v, {
      toValue: 1,
      duration: 320,
      delay: 60 + index * 70,
      useNativeDriver: true,
    }).start();
  }, [reduce, v, index]);
  return (
    <Animated.View
      style={{
        opacity: v,
        transform: [
          {translateY: v.interpolate({inputRange: [0, 1], outputRange: [10, 0]})},
        ],
      }}>
      {children}
    </Animated.View>
  );
}
