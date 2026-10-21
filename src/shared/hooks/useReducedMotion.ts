/**
 * Combine le réglage app « limiter les animations » et
 * AccessibilityInfo.isReduceMotionEnabled (+ écoute reduceMotionChanged).
 */
import {useEffect, useState} from 'react';
import {AccessibilityInfo} from 'react-native';
import {useTheme} from '../theme';

export function useReducedMotion(): boolean {
  const {appearance} = useTheme();
  const [systemReduce, setSystemReduce] = useState(false);

  useEffect(() => {
    let mounted = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then(v => {
        if (mounted) setSystemReduce(v);
      })
      .catch(() => {
        // ignore
      });
    const sub = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      (v: boolean) => {
        setSystemReduce(v);
      },
    );
    return () => {
      mounted = false;
      sub.remove();
    };
  }, []);

  return appearance.limitAnimations || systemReduce;
}
