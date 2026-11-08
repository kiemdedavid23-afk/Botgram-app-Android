import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import {monogram} from '../companyLogic';
import {companyFonts, useCompanyTheme} from '../companyTheme';

type Props = {
  /** Nom de l'entreprise : on en tire les initiales. */
  name: string | null | undefined;
  size?: number;
};

/** Pastille de l'entreprise : initiales sur le dégradé de sa couleur de marque. */
export function CompanyMark({name, size = 40}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const small = size < 30;
  const letters = small ? monogram(name).slice(0, 1) : monogram(name);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[styles.box, {width: size, height: size, borderRadius: Math.round(size * 0.32)}]}>
      <GradientView colors={[t.heroHi, t.heroLo]} angle={150} style={StyleSheet.absoluteFill} />
      <Text style={[styles.text, {color: t.onHero, fontSize: Math.round(size * (small ? 0.52 : 0.4))}]}>{letters}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  text: {fontFamily: companyFonts.display, fontWeight: '700'},
});
