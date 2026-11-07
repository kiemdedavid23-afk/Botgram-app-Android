import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import {useReducedMotion} from '../../../../shared/hooks/useReducedMotion';
import {clockLabel, quotaLevel, quotaSegments} from '../companyLogic';
import {companyFonts, useCompanyTheme} from '../companyTheme';
import {Panel} from './Primitives';

const SEGMENTS = 24;

type Props = {
  used: number | null;
  limit: number | null;
  resetsAt: number | null;
};

/** Quota d'envoi partagé par l'équipe : jauge à segments qui se remplit à l'ouverture. */
export function QuotaPanel({used, limit, resetsAt}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const reduce = useReducedMotion();
  const lit = quotaSegments(used, limit, SEGMENTS);
  const level = quotaLevel(used, limit);
  const color =
    level === 'bad' ? t.bad : level === 'warn' ? t.warn : level === 'ok' ? t.good : t.lineStrong;
  const fill = useRef(new Animated.Value(reduce ? lit : 0)).current;

  useEffect(() => {
    if (reduce) {
      fill.setValue(lit);
      return;
    }
    Animated.timing(fill, {toValue: lit, duration: 700, useNativeDriver: true}).start();
  }, [lit, reduce, fill]);

  const reset = clockLabel(resetsAt);
  return (
    <Panel rail>
      <View style={styles.body}>
        <View style={styles.top}>
          <Text style={[styles.big, {color: t.ink}]}>
            {used ?? '–'}
            <Text style={[styles.of, {color: t.inkSoft}]}>{`  /  ${limit ?? '–'}`}</Text>
          </Text>
          <Text style={[styles.unit, {color: t.inkSoft}]}>envois aujourd’hui</Text>
        </View>
        <View style={styles.bar}>
          {Array.from({length: SEGMENTS}, (_, i) => (
            <View key={i} style={[styles.seg, {backgroundColor: t.line}]}>
              <Animated.View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: color,
                    opacity: fill.interpolate({
                      inputRange: [i, i + 1],
                      outputRange: [0, 1],
                      extrapolate: 'clamp',
                    }),
                  },
                ]}
              />
            </View>
          ))}
        </View>
        <Text style={[styles.note, {color: t.inkSoft}]}>
          {`Compteur partagé par toute l’équipe${reset ? ` · remis à zéro à ${reset}` : ''}`}
        </Text>
      </View>
    </Panel>
  );
}

const styles = StyleSheet.create({
  body: {padding: 14, gap: 12},
  top: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between'},
  big: {fontFamily: companyFonts.display, fontSize: 28, fontWeight: '700'},
  of: {fontFamily: companyFonts.value, fontSize: 16, fontWeight: '400'},
  unit: {fontFamily: companyFonts.body, fontSize: 12.5},
  bar: {flexDirection: 'row', gap: 3},
  seg: {flex: 1, height: 14, borderRadius: 1, overflow: 'hidden'},
  note: {fontFamily: companyFonts.body, fontSize: 12},
});
