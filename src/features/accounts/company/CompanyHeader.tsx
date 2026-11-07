import React from 'react';
import {View, Text, StatusBar, StyleSheet} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {monogram, roleTag} from './companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from './companyTheme';
import {useWorkspaceStore} from '../store/workspaceStore';

/** En-tête entreprise : marine plein, monogramme doré, filet doré. Aucune marque Botgram. */
export function CompanyHeader({right}: {right?: React.ReactNode}): React.JSX.Element {
  const t = useCompanyTheme();
  const insets = useSafeAreaInsets();
  const ws = useWorkspaceStore(s => s.workspaces[0] ?? null);
  const name = ws?.name || 'Votre entreprise';
  return (
    <View style={[styles.bar, {backgroundColor: t.navy, borderBottomColor: t.gold}]}>
      <StatusBar barStyle="light-content" />
      <View style={{height: insets.top, backgroundColor: t.navy}} />
      <View style={styles.inner}>
        <View style={[styles.mono, {borderColor: t.gold}]}>
          <Text style={[styles.monoText, {color: t.gold}]}>{monogram(name)}</Text>
        </View>
        <View style={styles.titles}>
          <Text style={[styles.name, {color: t.onNavy}]} numberOfLines={1}>
            {name}
          </Text>
          <Text style={[styles.sub, {color: t.gold}]} numberOfLines={1}>
            {`Entreprise${ws ? ` · ${roleTag(ws.role)}` : ''}`}
          </Text>
        </View>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {borderBottomWidth: 2},
  inner: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, height: 60},
  mono: {width: 38, height: 38, borderWidth: 1.5, borderRadius: cm.radius, alignItems: 'center', justifyContent: 'center'},
  monoText: {fontFamily: companyFonts.display, fontSize: 16, fontWeight: '700'},
  titles: {flex: 1},
  name: {fontFamily: companyFonts.display, fontSize: 18, fontWeight: '700'},
  sub: {fontFamily: companyFonts.label, fontSize: 10.5, letterSpacing: 1.4, textTransform: 'uppercase', fontWeight: '700', marginTop: 1},
  right: {flexDirection: 'row', alignItems: 'center'},
});
