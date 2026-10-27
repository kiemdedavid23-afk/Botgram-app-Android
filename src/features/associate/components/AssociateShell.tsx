/**
 * En-tête + barre de progression — AssociateFlow.css .assoc / .assoc__head.
 */
import React from 'react';
import {View, Text, ScrollView, StyleSheet} from 'react-native';
import {ScreenHeader} from '../../../shared/components/ScreenHeader';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
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
  const {colors} = useTheme();
  const dots = Array.from({length: totalSteps}, (_, i) => i + 1);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScreenHeader title={title} onBack={onBack} />
      <View style={[styles.progress, {backgroundColor: colors.bgPrimary}]}>
        {dots.map(d => {
          const active = d === step;
          const done = d < step;
          return (
            <View
              key={d}
              style={[
                styles.dot,
                {
                  backgroundColor:
                    active || done ? colors.accent : colors.bgTertiary,
                },
                done && !active ? styles.dotDone : null,
              ]}
            />
          );
        })}
      </View>
      <Text style={[styles.stepLbl, {color: colors.textSecondary}]}>
        {stepLabel(step, totalSteps)}
      </Text>
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
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
