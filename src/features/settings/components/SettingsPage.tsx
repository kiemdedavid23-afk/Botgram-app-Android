/**
 * Page Paramètres : en-tête unique + fond. Le contenu gère son défilement.
 * Compte entreprise : fond en dégradé lavande, comme le tableau de bord.
 */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {SettingsHeader} from './SettingsHeader';
import {useSettingsPalette} from './settingsPalette';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

export function SettingsPage({title, onBack, right, children}: Props): React.JSX.Element {
  const p = useSettingsPalette();
  return (
    <View style={[styles.root, {backgroundColor: p.bg}]}>
      {p.company ? <GradientView colors={[p.bg, p.bgGlow]} angle={165} style={StyleSheet.absoluteFill} /> : null}
      <SettingsHeader title={title} onBack={onBack} right={right} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1}});
