/**
 * Héros du tableau de bord — DashboardPage.css .dash-hero.
 * Repli flou pastilles : fond blanc 18 % (pas de backdrop-filter).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated, AccessibilityInfo} from 'react-native';
import Svg, {Defs, RadialGradient, Stop, Circle} from 'react-native-svg';
import {Bot, Zap} from 'lucide-react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme, dashboardMetrics as dm, gradients} from '../../../shared/theme';
import {texts, greetLine, heroSubZero, heroSubOne, heroSubMany, chipBots, chipRemaining} from '../texts';
import {greetingWord, firstName, heroSubtitle} from '../logic';

type Props = {
  displayName: string | null;
  botCount: number;
  remaining: number | null;
  reduceMotion: boolean;
};

export function HeroCard({
  displayName,
  botCount,
  remaining,
  reduceMotion,
}: Props): React.JSX.Element {
  const {mode} = useTheme();
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
      Animated.timing(wave, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(wave, {
        toValue: -1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.timing(wave, {
        toValue: 0,
        duration: 400,
        useNativeDriver: true,
      }),
    ]);
    // 2 itérations
    Animated.sequence([waveAnim, waveAnim]).start();
    const floatA = Animated.loop(
      Animated.sequence([
        Animated.timing(orbA, {
          toValue: 1,
          duration: 3500,
          useNativeDriver: true,
        }),
        Animated.timing(orbA, {
          toValue: 0,
          duration: 3500,
          useNativeDriver: true,
        }),
      ]),
    );
    const floatB = Animated.loop(
      Animated.sequence([
        Animated.timing(orbB, {
          toValue: 1,
          duration: 4500,
          useNativeDriver: true,
        }),
        Animated.timing(orbB, {
          toValue: 0,
          duration: 4500,
          useNativeDriver: true,
        }),
      ]),
    );
    floatA.start();
    floatB.start();
    return () => {
      floatA.stop();
      floatB.stop();
    };
  }, [reduceMotion, wave, orbA, orbB]);

  const waveRot = wave.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-20deg', '0deg', '20deg'],
  });
  const tyA = orbA.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 10],
  });
  const tyB = orbB.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -12],
  });

  return (
    <GradientView
      colors={[...grad.colors]}
      angle={grad.angle}
      style={[
        styles.hero,
        mode === 'dark' ? styles.heroShadowDark : styles.heroShadowLight,
      ]}>
      <Animated.View
        style={[styles.orbA, {transform: [{translateY: tyA}]}]}
        pointerEvents="none">
        <Svg width={dm.orbA} height={dm.orbA}>
          <Defs>
            <RadialGradient id="oa" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.38" />
              <Stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={dm.orbA / 2} cy={dm.orbA / 2} r={dm.orbA / 2} fill="url(#oa)" />
        </Svg>
      </Animated.View>
      <Animated.View
        style={[styles.orbB, {transform: [{translateY: tyB}]}]}
        pointerEvents="none">
        <Svg width={dm.orbB} height={dm.orbB}>
          <Defs>
            <RadialGradient id="ob" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.24" />
              <Stop offset="70%" stopColor="#ffffff" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={dm.orbB / 2} cy={dm.orbB / 2} r={dm.orbB / 2} fill="url(#ob)" />
        </Svg>
      </Animated.View>
      <View style={styles.content}>
        <View style={styles.greetRow}>
          <Text style={styles.greet}>{greetLine(word, name)}</Text>
          <Animated.Text
            style={[styles.greet, {transform: [{rotate: waveRot}]}]}>
            {texts.wave}
          </Animated.Text>
        </View>
        <Text style={styles.sub}>{sub}</Text>
        <View style={styles.chips}>
          <View style={styles.chip}>
            <Bot size={dm.chipIcon} color="#ffffff" />
            <Text style={styles.chipText}>{chipBots(botCount)}</Text>
          </View>
          <View style={styles.chip}>
            <Zap size={dm.chipIcon} color="#ffffff" />
            <Text style={styles.chipText}>{chipRemaining(remaining)}</Text>
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
  // DashboardPage.css : 0 12 28 -12 rgba(42,171,238,.7) → elevation 8
  heroShadowLight: {
    elevation: 8,
    shadowColor: '#2aabee',
    shadowOpacity: 0.7,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 12},
  },
  // sombre : rgba(0,0,0,.8)
  heroShadowDark: {
    elevation: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.8,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 12},
  },
  orbA: {
    position: 'absolute',
    right: -60,
    top: -90,
    width: dm.orbA,
    height: dm.orbA,
  },
  orbB: {
    position: 'absolute',
    left: -50,
    bottom: -80,
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
    color: '#ffffff',
    fontSize: dm.greetSize,
    fontWeight: '800',
    lineHeight: dm.greetSize * 1.15,
    letterSpacing: -0.03 * dm.greetSize,
  },
  sub: {
    marginTop: dm.heroSubMarginTop,
    color: 'rgba(255,255,255,0.9)',
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
    backgroundColor: 'rgba(255,255,255,0.18)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.24)',
  },
  chipText: {
    color: '#ffffff',
    fontSize: dm.chipFont,
    fontWeight: '600',
  },
});
