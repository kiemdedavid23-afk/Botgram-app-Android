import React from 'react';
import {View, StyleSheet} from 'react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import {useCompanyTheme} from '../companyTheme';
import {FlowHeader} from './FlowHeader';

type Props = {
  title: string;
  onBack?: () => void;
  right?: React.ReactNode;
  children: React.ReactNode;
};

/** Page de sous-écran, style entreprise : fond en dégradé lavande + en-tête. Le contenu gère son défilement. */
export function FlowPage({title, onBack, right, children}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <View style={[styles.root, {backgroundColor: t.bg}]}>
      <GradientView colors={[t.bg, t.bgGlow]} angle={165} style={StyleSheet.absoluteFill} />
      <FlowHeader title={title} onBack={onBack} right={right} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({root: {flex: 1}});
