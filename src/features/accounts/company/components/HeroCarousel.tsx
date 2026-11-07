import React, {useRef, useState} from 'react';
import {View, Text, Animated, StyleSheet, useWindowDimensions} from 'react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import {useReducedMotion} from '../../../../shared/hooks/useReducedMotion';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';
import {CardTitle} from './ui';

export type HeroSlide = {
  label: string;
  value: string;
  /** Dénominateur affiché en plus petit (« / 165 »). */
  of?: string;
  note?: string;
  /** 0–1 : petite jauge sous le chiffre. */
  fill?: number;
};

type Props = {
  title: string;
  slides: readonly HeroSlide[];
  onOpen?: () => void;
  openLabel?: string;
};

const GAP = 12;

/** Grande carte bleue : cartes translucides qu'on fait défiler, voisines inclinées. */
export function HeroCarousel({title, slides, onOpen, openLabel}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const reduce = useReducedMotion();
  const {width} = useWindowDimensions();
  const inner = width - cm.pageH * 2;
  const cardW = Math.min(210, Math.round(inner * 0.56));
  const step = cardW + GAP;
  const sidePad = (inner - cardW) / 2;
  const x = useRef(new Animated.Value(0)).current;
  const [index, setIndex] = useState(0);

  return (
    <View style={[styles.hero, {shadowColor: t.primary}]}>
      <GradientView colors={[t.primaryHi, t.primary]} angle={160} style={StyleSheet.absoluteFill} />
      <View style={styles.head}>
        <CardTitle title={title} color={t.onPrimary} onPress={onOpen} actionLabel={openLabel} onColor />
      </View>
      <Animated.ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        snapToInterval={step}
        decelerationRate="fast"
        disableIntervalMomentum
        contentContainerStyle={{paddingHorizontal: sidePad, paddingVertical: 14}}
        scrollEventThrottle={16}
        onScroll={Animated.event([{nativeEvent: {contentOffset: {x}}}], {useNativeDriver: true})}
        onMomentumScrollEnd={e => {
          setIndex(Math.max(0, Math.min(slides.length - 1, Math.round(e.nativeEvent.contentOffset.x / step))));
        }}>
        {slides.map((s, i) => {
          const range = [(i - 1) * step, i * step, (i + 1) * step];
          const tilt = reduce
            ? []
            : [
                {rotate: x.interpolate({inputRange: range, outputRange: ['-6deg', '0deg', '6deg'], extrapolate: 'clamp'})},
                {scale: x.interpolate({inputRange: range, outputRange: [0.9, 1, 0.9], extrapolate: 'clamp'})},
              ];
          return (
            <Animated.View
              key={s.label}
              style={[
                styles.slide,
                {
                  width: cardW,
                  marginRight: i === slides.length - 1 ? 0 : GAP,
                  opacity: reduce ? 1 : x.interpolate({inputRange: range, outputRange: [0.55, 1, 0.55], extrapolate: 'clamp'}),
                  transform: tilt,
                },
              ]}>
              <Text style={styles.label}>{s.label}</Text>
              <Text style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
                {s.value}
                {s.of ? <Text style={styles.of}>{` ${s.of}`}</Text> : null}
              </Text>
              {s.fill !== undefined ? (
                <View style={styles.track}>
                  <View style={[styles.fill, {width: `${Math.round(Math.max(0, Math.min(1, s.fill)) * 100)}%`}]} />
                </View>
              ) : null}
              {s.note ? (
                <Text style={styles.note} numberOfLines={2}>
                  {s.note}
                </Text>
              ) : null}
            </Animated.View>
          );
        })}
      </Animated.ScrollView>
      <View style={styles.dots}>
        {slides.map((s, i) => (
          <View key={s.label} style={[styles.dot, i === index ? styles.dotOn : null]} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    borderRadius: cm.cardRadius,
    overflow: 'hidden',
    paddingTop: cm.cardPad,
    paddingBottom: 18,
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 5,
  },
  head: {paddingHorizontal: cm.cardPad},
  slide: {
    height: 128,
    borderRadius: 26,
    padding: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'space-between',
  },
  label: {fontFamily: companyFonts.body, fontSize: 14, color: 'rgba(255,255,255,0.85)'},
  value: {fontFamily: companyFonts.display, fontSize: 38, fontWeight: '700', color: '#FFFFFF', letterSpacing: -0.5},
  of: {fontSize: 18, fontWeight: '400', color: 'rgba(255,255,255,0.75)'},
  track: {height: 5, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.28)', overflow: 'hidden'},
  fill: {height: 5, backgroundColor: '#FFFFFF'},
  note: {fontFamily: companyFonts.body, fontSize: 12.5, color: 'rgba(255,255,255,0.85)'},
  dots: {flexDirection: 'row', justifyContent: 'center', gap: 8},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.4)'},
  dotOn: {backgroundColor: '#FFFFFF'},
});
