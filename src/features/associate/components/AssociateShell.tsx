/**
 * En-tête + barre de progression du parcours d'association, style entreprise :
 * page en dégradé, segments de progression dans la couleur de marque.
 */
import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {associateMetrics as m} from '../../../shared/theme';
import {companyFonts, useCompanyTheme} from '../../accounts/company/companyTheme';
import {FlowPage} from '../../accounts/company/components/FlowPage';
import {stepLabel} from '../texts';

type Props = {
  title: string;
  step: number;
  totalSteps?: number;
  onBack?: () => void;
  children: React.ReactNode;
};

export function AssociateShell({
  title,
  step,
  totalSteps = 5,
  onBack,
  children,
}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const dots = Array.from({length: totalSteps}, (_, i) => i + 1);

  return (
    <FlowPage title={title} onBack={onBack}>
      <View
        accessible
        accessibilityLabel={stepLabel(step, totalSteps)}
        style={styles.progress}>
        {dots.map(d => {
          const active = d === step;
          const done = d < step;
          return (
            <View
              key={d}
              style={[
                styles.dot,
                {backgroundColor: active || done ? t.primary : t.chipBorder},
                done && !active ? styles.dotDone : null,
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.stepLbl, {color: t.inkSoft}]}>
        {stepLabel(step, totalSteps)}
      </Text>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </FlowPage>
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: 'row',
    gap: m.progressGap,
    paddingHorizontal: m.progressPadH,
    paddingBottom: m.progressPadBottom,
    paddingTop: m.progressPadTop,
  },
  dot: {
    flex: 1,
    height: m.progressH,
    borderRadius: m.progressRadius,
  },
  dotDone: {opacity: m.progressDoneOpacity},
  stepLbl: {
    fontFamily: companyFonts.body,
    fontSize: m.stepLabelSize,
    textAlign: 'center',
    marginTop: m.stepLabelMarginTop,
    marginBottom: m.stepLabelMarginBottom,
  },
  body: {
    paddingTop: m.bodyPadTop,
    paddingHorizontal: m.bodyPadH,
    paddingBottom: m.bodyPadBottom,
    gap: m.bodyGap,
  },
});
