/**
 * Héros — DashboardPage.css .db-hero.
 * Orbes : @keyframes db-float l.64-66 translate(-10px,12px) ;
 * A 7s, B 9s reverse delay -3s (l.52-61).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {Bot, Zap} from 'lucide-react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme, dashboardMetrics as dm, gradients} from '../../../shared/theme';
import {
  texts,
  greetLine,
  heroSubZero,
  heroSubOne,
  heroSubMany,
  chipBots,
  chipRemaining,
} from '../texts';
import {greetingWord, firstName, heroSubtitle} from '../logic';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type Props = {
  displayName: string | null;
  botCount: number;
  remaining: number | null;
};

export function HeroCard({
  displayName,
  botCount,
  remaining,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const reduceMotion = useReducedMotion();
  const hour = new Date().getHours();
  const word = greetingWord(hour);
  const name = firstName(displayName);
  const subKind = heroSubtitle(botCount);
  const sub =
    subKind === 'zero'
      ? heroSubZero()
      : subKind === 'one'
        ? heroSubOne()
        : heroSubMany(botCount);

  const grad = mode === 'dark' ? gradients.brandHeroAlt : gradients.brandHero;
  const wave = useRef(new Animated.Value(0)).current;
  const orbA = useRef(new Animated.Value(0)).current;
  const orbB = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reduceMotion) {
      wave.setValue(0);
      orbA.setValue(0);
      orbB.setValue(0);
      return;
    }
    const waveAnim = Animated.sequence([
      Animated.delay(600),
      Animated.timing(wave, {toValue: 1, duration: 400, useNativeDriver: true}),
      Animated.timing(wave, {toValue: -1, duration: 400, useNativeDriver: true}),
      Animated.timing(wave, {toValue: 0, duration: 400, useNativeDriver: true}),
    ]);
    Animated.sequence([waveAnim, waveAnim]).start();

    // db-float : 0→50% translate(-10,12), 50→100% back ; reverse = opposite direction
    const floatA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, {
          toValue: 1,
          duration: dm.orbADurationMs / 2,
          useNativeDriver: true,
        }),
        Animated.timing(orbA, {
          toValue: 0,
          duration: dm.orbADurationMs / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    const floatB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, {
          toValue: 1,
          duration: dm.orbBDurationMs / 2,
          useNativeDriver: true,
        }),
        Animated.timing(orbB, {
          toValue: 0,
          duration: dm.orbBDurationMs / 2,
          useNativeDriver: true,
        }),
      ]),
    );
    // décalage -3s pour orbe B (démarrage à mi-cycle inverse)
    const t = setTimeout(() => floatB.start(), 0);
    // reverse : start at 1 via offset — simulate by starting B at opposite phase
    orbB.setValue(1);
    floatA.start();
    return () => {
      clearTimeout(t);
      floatA.stop();
      floatB.stop();
    };
  }, [reduceMotion, wave, orbA, orbB]);

  const waveRot = wave.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });
  // translate(-10px, 12px) at peak
  const txA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dm.orbFloatX],
  });
  const tyA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, dm.orbFloatY],
  });
  // reverse : translate(+10, -12)
  const txB = orbB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -dm.orbFloatX],
  });
  const tyB = orbB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -dm.orbFloatY],
  });

  const shadowStyle =
    mode === 'dark'
      ? {
          elevation: 10,
          shadowColor: colors.heroShadowDark,
          shadowOpacity: 0.8,
          shadowRadius: 14,
          shadowOffset: {width: 0, height: 12},
        }
      : {
          elevation: 8,
          shadowColor: colors.heroShadow,
          shadowOpacity: 0.7,
          shadowRadius: 14,
          shadowOffset: {width: 0, height: 12},
        };

  return (
    <GradientView
      colors={[...grad.colors]}
      angle={grad.angle}
      style={[styles.hero, shadowStyle]}>
      <Animated.View
        style={[
          styles.orbA,
          {transform: [{translateX: txA}, {translateY: tyA}]},
        ]}
        pointerEvents="none">
        <Svg width={dm.orbA} height={dm.orbA}>
          <Defs>
            <RadialGradient id="oa" cx="30%" cy="30%" r="50%">
              <Stop offset="0%" stopColor={colors.white} stopOpacity="0.38" />
              <Stop offset="70%" stopColor={colors.white} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={dm.orbA / 2}
            cy={dm.orbA / 2}
            r={dm.orbA / 2}
            fill="url(#oa)"
          />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[
          styles.orbB,
          {transform: [{translateX: txB}, {translateY: tyB}]},
        ]}
        pointerEvents="none">
        <Svg width={dm.orbB} height={dm.orbB}>
          <Defs>
            <RadialGradient id="ob" cx="60%" cy="40%" r="50%">
              <Stop offset="0%" stopColor={colors.white} stopOpacity="0.24" />
              <Stop offset="70%" stopColor={colors.white} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle
            cx={dm.orbB / 2}
            cy={dm.orbB / 2}
            r={dm.orbB / 2}
            fill="url(#ob)"
          />
        </Svg>
      </Animated.View>
      <View style={styles.content}>
        <View style={styles.greetRow}>
          <Text style={[styles.greet, {color: colors.heroText}]}>
            {greetLine(word, name)}
          </Text>
          <Animated.Text
            style={[
              styles.greet,
              {color: colors.heroText, transform: [{rotate: waveRot}]},
            ]}>
            {texts.wave}
          </Animated.Text>
        </View>
        <Text style={[styles.sub, {color: colors.heroTextMuted}]}>{sub}</Text>
        <View style={styles.chips}>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.heroChipBg,
                borderColor: colors.heroChipBorder,
              },
            ]}>
            <Bot size={dm.chipIcon} color={colors.heroText} />
            <Text style={[styles.chipText, {color: colors.heroText}]}>
              {chipBots(botCount)}
            </Text>
          </View>
          <View
            style={[
              styles.chip,
              {
                backgroundColor: colors.heroChipBg,
                borderColor: colors.heroChipBorder,
              },
            ]}>
            <Zap size={dm.chipIcon} color={colors.heroText} />
            <Text style={[styles.chipText, {color: colors.heroText}]}>
              {chipRemaining(remaining)}
            </Text>
          </View>
        </View>
      </View>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: dm.heroRadius,
    minHeight: dm.heroMinHeight,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  orbA: {
    position: 'absolute',
    right: dm.orbARight,
    top: dm.orbATop,
    width: dm.orbA,
    height: dm.orbA,
  },
  orbB: {
    position: 'absolute',
    left: dm.orbBLeft,
    bottom: dm.orbBBottom,
    width: dm.orbB,
    height: dm.orbB,
  },
  content: {
    paddingTop: dm.heroPaddingTop,
    paddingHorizontal: dm.heroPaddingH,
    paddingBottom: dm.heroPaddingBottom,
  },
  greetRow: {flexDirection: 'row', alignItems: 'center', gap: 6},
  greet: {
    fontSize: dm.greetSize,
    fontWeight: dm.greetWeight,
    lineHeight: dm.greetSize * 1.15,
    letterSpacing: -0.03 * dm.greetSize,
  },
  sub: {
    marginTop: dm.heroSubMarginTop,
    fontSize: dm.heroSubSize,
    lineHeight: dm.heroSubSize * 1.55,
  },
  chips: {
    marginTop: dm.chipMarginTop,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: dm.chipGap,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dm.chipIconGap,
    paddingVertical: dm.chipPadV,
    paddingHorizontal: dm.chipPadH,
    borderRadius: dm.chipRadius,
    borderWidth: 1,
  },
  chipText: {
    fontSize: dm.chipFont,
    fontWeight: dm.weight600,
  },
});
