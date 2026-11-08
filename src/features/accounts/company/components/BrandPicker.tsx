import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Check} from 'lucide-react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import {useWorkspaceStore} from '../../store/workspaceStore';
import {useBrandStore} from '../../store/brandStore';
import {BRAND_PRESETS} from '../companyPalette';
import {companyFonts, companyMetrics as cm, useBrandId, useCompanyTheme} from '../companyTheme';

const SWATCH = 44;

/** Choix de la couleur de marque : pastilles de couleur, la choisie porte un anneau et une coche. */
export function BrandPicker(): React.JSX.Element | null {
  const t = useCompanyTheme();
  const wsId = useWorkspaceStore(s => s.workspaces[0]?.id ?? null);
  const current = useBrandId();
  const setBrand = useBrandStore(s => s.setBrand);
  if (!wsId) return null;
  return (
    <View>
      <View style={styles.row} accessibilityRole="radiogroup">
        {BRAND_PRESETS.map(p => {
          const on = p.id === current;
          return (
            <Pressable
              key={p.id}
              accessibilityRole="radio"
              accessibilityLabel={`Couleur ${p.label}`}
              accessibilityState={{selected: on}}
              onPress={() => setBrand(wsId, p.id)}
              hitSlop={4}
              style={({pressed}) => [
                styles.ring,
                {borderColor: on ? t.ink : 'transparent', opacity: pressed ? 0.7 : 1},
              ]}>
              <View style={styles.swatch}>
                <GradientView colors={[p.heroHi, p.heroLo]} angle={150} style={StyleSheet.absoluteFill} />
                {on ? <Check size={20} color="#FFFFFF" strokeWidth={3} /> : null}
              </View>
            </Pressable>
          );
        })}
      </View>
      <Text style={[styles.hint, {color: t.inkSoft}]}>Appliquée sur cet appareil.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14},
  ring: {width: SWATCH + 8, height: SWATCH + 8, borderRadius: (SWATCH + 8) / 2, borderWidth: 2, alignItems: 'center', justifyContent: 'center'},
  swatch: {width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  hint: {fontFamily: companyFonts.body, fontSize: cm.captionSize, marginTop: 12},
});
