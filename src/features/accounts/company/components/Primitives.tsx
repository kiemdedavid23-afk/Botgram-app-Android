/** Briques visuelles « entreprise » : étiquette à filet, panneau à rail doré, point d'état. */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useReducedMotion} from '../../../../shared/hooks/useReducedMotion';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';

export function SectionLabel({
  children,
  right,
}: {
  children: string;
  right?: string;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={styles.labelRow}>
      <Text style={[styles.label, {color: t.inkSoft}]}>{children}</Text>
      <View style={[styles.rule, {backgroundColor: t.line}]} />
      {right ? <Text style={[styles.labelRight, {color: t.inkSoft}]}>{right}</Text> : null}
    </View>
  );
}

export function Panel({
  children,
  rail = false,
}: {
  children: React.ReactNode;
  /** Rail doré à gauche : met un panneau en avant. */
  rail?: boolean;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View
      style={[
        styles.panel,
        {backgroundColor: t.surface, borderColor: t.line},
        rail ? {borderLeftColor: t.gold, borderLeftWidth: cm.rail} : null,
      ]}>
      {children}
    </View>
  );
}

export function KeyValue({
  label,
  value,
  last,
}: {
  label: string;
  value: string;
  last?: boolean;
}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View
      style={[
        styles.kv,
        !last ? {borderBottomColor: t.line, borderBottomWidth: StyleSheet.hairlineWidth} : null,
      ]}>
      <Text style={[styles.kvLabel, {color: t.inkSoft}]}>{label}</Text>
      <Text style={[styles.kvValue, {color: t.ink}]} numberOfLines={2}>
        {value || '—'}
      </Text>
    </View>
  );
}

/** Point d'état ; un halo pulse quand `live` (désactivé si l'animation est réduite). */
export function StatusDot({
  color,
  live,
}: {
  color: string;
  live?: boolean;
}): React.JSX.Element {
  const reduce = useReducedMotion();
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!live || reduce) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {toValue: 1, duration: 1800, useNativeDriver: true}),
    );
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
              transform: [
                {scale: pulse.interpolate({inputRange: [0, 1], outputRange: [1, 2.4]})},
              ],
            },
          ]}
        />
      ) : null}
      <View style={[styles.dot, {backgroundColor: color}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  labelRow: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8},
  label: {
    fontFamily: companyFonts.label,
    fontSize: cm.labelSize,
    letterSpacing: cm.labelSpacing,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  labelRight: {fontFamily: companyFonts.value, fontSize: 12},
  rule: {flex: 1, height: StyleSheet.hairlineWidth},
  panel: {borderWidth: 1, borderRadius: cm.radius, overflow: 'hidden'},
  kv: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  kvLabel: {fontFamily: companyFonts.body, fontSize: 13},
  kvValue: {
    flex: 1,
    textAlign: 'right',
    fontFamily: companyFonts.value,
    fontSize: 14,
  },
  dotBox: {width: 14, height: 14, alignItems: 'center', justifyContent: 'center'},
  dot: {width: 8, height: 8, borderRadius: 4},
  halo: {position: 'absolute', width: 8, height: 8, borderRadius: 4},
});
