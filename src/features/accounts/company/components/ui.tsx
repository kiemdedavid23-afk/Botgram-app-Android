/** Briques de l'habillage entreprise : carte, bouton flèche, tuile, pastille, ligne clé/valeur. */
import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, Animated, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {useReducedMotion} from '../../../../shared/hooks/useReducedMotion';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';

export function Card({
  children,
  style,
  padded = true,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  padded?: boolean;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View
      style={[
        styles.card,
        {backgroundColor: t.card, borderColor: t.cardEdge, shadowColor: t.shadow},
        padded ? {padding: cm.cardPad} : null,
        style,
      ]}>
      {children}
    </View>
  );
}

/** Petit carré blanc à flèche, en haut à droite d'une carte. */
export function ArrowButton({
  onPress,
  label,
  onColor,
}: {
  onPress: () => void;
  label: string;
  /** Sur fond bleu : bouton blanc, flèche bleue. */
  onColor?: boolean;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={8}
      style={({pressed}) => [
        styles.arrow,
        {backgroundColor: t.tile, opacity: pressed ? 0.7 : 1},
      ]}>
      <ArrowRight size={18} color={onColor ? t.primary : t.ink} />
    </Pressable>
  );
}

export function CardTitle({
  title,
  onPress,
  actionLabel,
  onColor,
  color,
}: {
  title: string;
  onPress?: () => void;
  actionLabel?: string;
  onColor?: boolean;
  color?: string;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={styles.titleRow}>
      <Text style={[styles.title, {color: color ?? t.ink}]} numberOfLines={1}>
        {title}
      </Text>
      {onPress ? <ArrowButton onPress={onPress} label={actionLabel ?? title} onColor={onColor} /> : null}
    </View>
  );
}

/** Tuile blanche arrondie (icône d'un élément de liste). */
export function Tile({children}: {children: React.ReactNode}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={[styles.tile, {backgroundColor: t.tile}]}>{children}</View>
  );
}

export function Chip({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.chip,
        {borderColor: t.chipBorder, backgroundColor: pressed ? t.soft : 'transparent'},
      ]}>
      <Text style={[styles.chipText, {color: t.ink}]}>{label}</Text>
    </Pressable>
  );
}

export function OutlineButton({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({pressed}) => [
        styles.outline,
        {borderColor: t.chipBorder, backgroundColor: pressed ? t.soft : 'transparent'},
      ]}>
      <Text style={[styles.outlineText, {color: t.ink}]}>{label}</Text>
    </Pressable>
  );
}

export function Divider(): React.JSX.Element {
  const t = useCompanyTheme();
  return <View style={[styles.divider, {backgroundColor: t.line}]} />;
}

export function KeyValue({label, value}: {label: string; value: string}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={styles.kv}>
      <Text style={[styles.kvLabel, {color: t.inkSoft}]}>{label}</Text>
      <Text style={[styles.kvValue, {color: t.ink}]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

/** Point d'état ; un halo pulse quand `live` (désactivé si l'animation est réduite). */
export function StatusDot({color, live}: {color: string; live?: boolean}): React.JSX.Element {
  const reduce = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live || reduce) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(Animated.timing(pulse, {toValue: 1, duration: 1800, useNativeDriver: true}));
    loop.start();
    return () => loop.stop();
  }, [live, reduce, pulse]);
  return (
    <View style={styles.dotBox}>
      {live && !reduce ? (
        <Animated.View
          style={[
            styles.halo,
            {
              backgroundColor: color,
              opacity: pulse.interpolate({inputRange: [0, 1], outputRange: [0.35, 0]}),
              transform: [{scale: pulse.interpolate({inputRange: [0, 1], outputRange: [1, 2.4]})}],
            },
          ]}
        />
      ) : null}
      <View style={[styles.dot, {backgroundColor: color}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: cm.cardRadius,
    borderWidth: 1,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
    elevation: 3,
  },
  arrow: {
    width: cm.arrowBtn,
    height: cm.arrowBtn,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12},
  title: {flex: 1, fontFamily: companyFonts.display, fontSize: 22, fontWeight: '700', letterSpacing: -0.2},
  tile: {width: cm.tile, height: cm.tile, borderRadius: cm.tileRadius, alignItems: 'center', justifyContent: 'center'},
  chip: {borderWidth: 1, borderRadius: cm.chipRadius, paddingHorizontal: 22, paddingVertical: 14},
  chipText: {fontFamily: companyFonts.body, fontSize: 17},
  outline: {borderWidth: 1, borderRadius: 14, paddingVertical: 15, alignItems: 'center'},
  outlineText: {fontFamily: companyFonts.body, fontSize: 17},
  divider: {height: StyleSheet.hairlineWidth},
  kv: {flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16, paddingVertical: 13},
  kvLabel: {fontFamily: companyFonts.body, fontSize: 15},
  kvValue: {flex: 1, textAlign: 'right', fontFamily: companyFonts.value, fontSize: 16},
  dotBox: {width: 14, height: 14, alignItems: 'center', justifyContent: 'center'},
  dot: {width: 9, height: 9, borderRadius: 5},
  halo: {position: 'absolute', width: 9, height: 9, borderRadius: 5},
});
