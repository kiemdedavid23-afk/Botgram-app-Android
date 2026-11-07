import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';

export type Kpi = {label: string; value: string; hint?: string};

/** Bandeau de trois indicateurs séparés par des filets (un seul cadre). */
export function KpiStrip({items}: {items: readonly Kpi[]}): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={[styles.strip, {backgroundColor: t.surface, borderColor: t.line}]}>
      {items.map((k, i) => (
        <View
          key={k.label}
          style={[
            styles.cell,
            i > 0 ? {borderLeftColor: t.line, borderLeftWidth: 1} : null,
          ]}>
          <Text style={[styles.label, {color: t.inkSoft}]} numberOfLines={1}>
            {k.label}
          </Text>
          <Text style={[styles.value, {color: t.ink}]} numberOfLines={1} adjustsFontSizeToFit>
            {k.value}
          </Text>
          {k.hint ? (
            <Text style={[styles.hint, {color: t.inkSoft}]} numberOfLines={1}>
              {k.hint}
            </Text>
          ) : null}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  strip: {flexDirection: 'row', borderWidth: 1, borderRadius: cm.radius},
  cell: {flex: 1, paddingVertical: 14, paddingHorizontal: 12},
  label: {
    fontFamily: companyFonts.label,
    fontSize: 10.5,
    letterSpacing: 1.1,
    textTransform: 'uppercase',
    fontWeight: '700',
  },
  value: {fontFamily: companyFonts.display, fontSize: 30, fontWeight: '700', marginTop: 6},
  hint: {fontFamily: companyFonts.body, fontSize: 11.5, marginTop: 2},
});
