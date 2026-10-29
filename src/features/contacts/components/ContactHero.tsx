/**
 * Héros profil contact — même langage que ProfileHero membre,
 * avec photo réelle (photo_url) via Avatar.
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {AtSign, MessagesSquare} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  gradients,
} from '../../../shared/theme';
import {GradientView} from '../../../shared/components/GradientView';
import {Avatar} from '../../../shared/components/Avatar';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';
import {chatTypeLabel} from '../utils/format';

type Props = {
  displayName: string;
  photoUrl?: string | null;
  initials?: string | null;
  username?: string | null;
  chatType?: string | null;
};

export function ContactHero({
  displayName,
  photoUrl,
  initials,
  username,
  chatType,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const reduce = useReducedMotion();
  const chipIconSize = m.chipFont + 2;
  const typeLabel = chatTypeLabel(chatType);

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

  return (
    <GradientView
      colors={[...grad.colors]}
      angle={grad.angle ?? 145}
      style={styles.hero}>
      {!reduce ? (
        <>
          <Animated.View
            style={[
              styles.orbA,
              {
                transform: [
                  {translateX: tx(floatA)},
                  {translateY: ty(floatA)},
                ],
              },
            ]}
            pointerEvents="none">
            <Svg width={m.orbA} height={m.orbA}>
              <Defs>
                <RadialGradient id="orbA" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.22} />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle
                cx={m.orbA / 2}
                cy={m.orbA / 2}
                r={m.orbA / 2}
                fill="url(#orbA)"
              />
            </Svg>
          </Animated.View>
          <Animated.View
            style={[
              styles.orbB,
              {
                transform: [
                  {translateX: tx(floatB)},
                  {translateY: ty(floatB)},
                ],
              },
            ]}
            pointerEvents="none">
            <Svg width={m.orbB} height={m.orbB}>
              <Defs>
                <RadialGradient id="orbB" cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor="#ffffff" stopOpacity={0.14} />
                  <Stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle
                cx={m.orbB / 2}
                cy={m.orbB / 2}
                r={m.orbB / 2}
                fill="url(#orbB)"
              />
            </Svg>
          </Animated.View>
        </>
      ) : null}

      <View
        style={[
          styles.avatarRing,
          {backgroundColor: colors.heroChipBg},
        ]}>
        <Avatar
          size={m.avatarSize}
          photoUrl={photoUrl}
          initials={initials}
          title={displayName}
          viewable
        />
      </View>

      <Text style={[styles.name, {color: colors.heroText}]}>
        {displayName}
      </Text>

      <View style={styles.chips}>
        {username ? (
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.heroChipBg,
                borderColor: colors.heroChipBorder,
              },
            ]}>
            <AtSign size={chipIconSize} color={colors.heroText} />
            <Text style={[styles.chipText, {color: colors.heroText}]}>
              {username}
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
          <MessagesSquare size={chipIconSize} color={colors.heroText} />
          <Text style={[styles.chipText, {color: colors.heroText}]}>
            {typeLabel}
          </Text>
        </View>
      </View>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: m.heroRadius,
    minHeight: Math.min(m.heroMinHeight, 320),
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
  name: {
    marginTop: m.nameMarginTop,
    fontSize: m.nameSize,
    fontWeight: m.nameWeight,
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
    borderWidth: 1,
  },
  chipText: {
    fontSize: m.chipFont,
    fontWeight: '600',
  },
});
