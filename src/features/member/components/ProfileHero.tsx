/**
 * Héros profil membre — MemberProfilePage.css .mp-hero.
 * Orbes : mp-float 7s / 9s reverse delay -3s.
 * Pas de bouton photo (exclu L3c).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {Building2, User, BadgeCheck} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  gradients,
} from '../../../shared/theme';
import {GradientView} from '../../../shared/components/GradientView';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';
import {
  memberInitials,
  roleLabel,
  statusLabel,
  statusTone,
} from '../utils/format';
import {texts} from '../texts';

type Props = {
  displayName: string;
  status: string;
  emailVerified: boolean;
  organization?: string | null;
  role?: string | null;
};

export function ProfileHero({
  displayName,
  status,
  emailVerified,
  organization,
  role,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const reduce = useReducedMotion();
  const tone = statusTone(status);
  const initial = memberInitials(displayName);
  const roleText = roleLabel(role);
  const chipIconSize = m.chipFont + 2;

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

      <View
        style={[styles.avatarRing, {backgroundColor: colors.heroAvatarRing}]}>
        <View
          style={[
            styles.avatar,
            {backgroundColor: colors.heroAvatarInner},
          ]}>
          <Text style={[styles.avatarText, {color: colors.heroText}]}>
            {initial}
          </Text>
        </View>
      </View>

      <Text style={[styles.name, {color: colors.heroText}]}>
        {displayName || '—'}
      </Text>

      {organization ? (
        <View style={styles.org}>
          <Building2 size={m.orgSize + 2} color={colors.heroText} />
          <Text
            numberOfLines={1}
            style={[styles.orgText, {color: colors.heroText}]}>
            {organization}
          </Text>
        </View>
      ) : null}

      <View style={styles.chips}>
        {roleText ? (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.heroChipBg,
                borderColor: colors.heroChipBorder,
              },
            ]}>
            <User size={chipIconSize} color={colors.heroText} />
            <Text style={[styles.chipText, {color: colors.heroText}]}>
              {roleText}
            </Text>
          </View>
        ) : null}
        <View
          style={[
            styles.chip,
            {
              backgroundColor: colors.heroChipBg,
              borderColor: colors.heroChipBorder,
            },
          ]}>
          <View style={[styles.chipDot, {backgroundColor: dotColor}]} />
          <Text style={[styles.chipText, {color: colors.heroText}]}>
            {statusLabel(status)}
          </Text>
        </View>
        {emailVerified ? (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.heroChipBg,
                borderColor: colors.heroChipBorder,
              },
            ]}>
            <BadgeCheck size={chipIconSize} color={colors.heroText} />
            <Text style={[styles.chipText, {color: colors.heroText}]}>
              {texts.verifiedChip}
            </Text>
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
  },
  name: {
    marginTop: m.nameMarginTop,
    fontSize: m.nameSize,
    fontWeight: m.nameWeight,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  org: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: m.orgMarginTop,
    maxWidth: '100%',
  },
  orgText: {
    fontSize: m.orgSize,
    fontWeight: '600',
    flexShrink: 1,
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
    borderWidth: 1,
  },
  chipDot: {
    width: m.chipDot,
    height: m.chipDot,
    borderRadius: m.chipDot / 2,
  },
  chipText: {
    fontSize: m.chipFont,
    fontWeight: '600',
  },
});
