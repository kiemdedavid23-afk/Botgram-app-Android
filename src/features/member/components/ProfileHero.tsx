/**
 * Héros profil membre — MemberProfilePage.css .mp-hero.
 * Orbes : mp-float 7s / 9s reverse delay -3s.
 * Pas de bouton photo (exclu L3c).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {
  useTheme,
  memberProfileMetrics as m,
  gradients,
} from '../../../shared/theme';
import {GradientView} from '../../../shared/components/GradientView';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';
import {memberInitial, statusLabel, statusTone} from '../utils/format';
import {texts} from '../texts';

type Props = {
  displayName: string;
  status: string;
  emailVerified: boolean;
};

export function ProfileHero({
  displayName,
  status,
  emailVerified,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const reduce = useReducedMotion();
  const tone = statusTone(status);
  const initial = memberInitial(displayName);

  const floatA = useRef(new Animated.Value(0)).current;
  const floatB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduce) return;
    const loop = (val: Animated.Value, duration: number, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ]),
      ).start();
    loop(floatA, m.orbADurationMs, 0);
    loop(floatB, m.orbBDurationMs, m.orbBDelayMs);
  }, [reduce, floatA, floatB]);

  const tx = (v: Animated.Value) =>
    v.interpolate({
      inputRange: [0, 1],
      outputRange: [0, m.orbFloatX],
    });
  const ty = (v: Animated.Value) =>
    v.interpolate({
      inputRange: [0, 1],
      outputRange: [0, m.orbFloatY],
    });

  const grad =
    mode === 'dark' ? gradients.brandHeroAlt : gradients.brandHero;
  const dotColor =
    tone === 'good'
      ? colors.statusGood
      : tone === 'warn'
        ? colors.statusWarn
        : colors.statusBad;

  return (
    <GradientView
      colors={grad.colors}
      angle={grad.angle}
      style={styles.hero}>
      <Animated.View
        style={[
          styles.orbA,
          {
            transform: [{translateX: tx(floatA)}, {translateY: ty(floatA)}],
          },
        ]}
        pointerEvents="none">
        <Svg width={m.orbA} height={m.orbA}>
          <Defs>
            <RadialGradient id="oa" cx="30%" cy="30%" r="70%">
              <Stop offset="0%" stopColor={colors.white} stopOpacity={0.38} />
              <Stop offset="100%" stopColor={colors.white} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={m.orbA / 2}
            cy={m.orbA / 2}
            r={m.orbA / 2}
            fill="url(#oa)"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.orbB,
          {
            transform: [{translateX: tx(floatB)}, {translateY: ty(floatB)}],
          },
        ]}
        pointerEvents="none">
        <Svg width={m.orbB} height={m.orbB}>
          <Defs>
            <RadialGradient id="ob" cx="60%" cy="40%" r="70%">
              <Stop offset="0%" stopColor={colors.white} stopOpacity={0.24} />
              <Stop offset="100%" stopColor={colors.white} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle
            cx={m.orbB / 2}
            cy={m.orbB / 2}
            r={m.orbB / 2}
            fill="url(#ob)"
          />
        </Svg>
      </Animated.View>

      <View style={styles.avatarRing}>
        <View
          style={[
            styles.avatar,
            {backgroundColor: 'rgba(255,255,255,0.25)'},
          ]}>
          <Text style={styles.avatarText}>{initial}</Text>
        </View>
      </View>

      <Text style={styles.name}>{displayName || '—'}</Text>

      <View style={styles.chips}>
        <View style={styles.chip}>
          <View style={[styles.chipDot, {backgroundColor: dotColor}]} />
          <Text style={styles.chipText}>{statusLabel(status)}</Text>
        </View>
        {emailVerified ? (
          <View style={styles.chip}>
            <Text style={styles.chipText}>{texts.verifiedChip}</Text>
          </View>
        ) : null}
      </View>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: m.heroRadius,
    minHeight: m.heroMinHeight,
    paddingTop: m.heroPadTop,
    paddingHorizontal: m.heroPadH,
    paddingBottom: m.heroPadBottom,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  orbA: {
    position: 'absolute',
    right: m.orbARight,
    top: m.orbATop,
  },
  orbB: {
    position: 'absolute',
    left: m.orbBLeft,
    bottom: m.orbBBottom,
  },
  avatarRing: {
    borderRadius: 9999,
    padding: m.avatarPad,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  avatar: {
    width: m.avatarSize,
    height: m.avatarSize,
    borderRadius: m.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: m.avatarFont,
    fontWeight: '700',
    color: '#fff',
  },
  name: {
    marginTop: m.nameMarginTop,
    fontSize: m.nameSize,
    fontWeight: m.nameWeight,
    color: '#fff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: m.chipGap,
    marginTop: m.chipsMarginTop,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingVertical: m.chipPadV,
    paddingHorizontal: m.chipPadH,
    borderRadius: 99,
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  chipDot: {
    width: m.chipDot,
    height: m.chipDot,
    borderRadius: m.chipDot / 2,
  },
  chipText: {
    fontSize: m.chipFont,
    fontWeight: '600',
    color: '#fff',
  },
});
