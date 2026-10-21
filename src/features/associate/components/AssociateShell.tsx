/**
 * En-tête + barre de progression — AssociateFlow.css .assoc / .assoc__head.
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
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
      <View
        style={[
          styles.head,
          {
            backgroundColor: colors.bgPrimary,
            borderBottomColor: colors.border,
          },
        ]}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.back}>
            <ChevronLeft size={m.headIcon} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text
          style={[styles.title, {color: colors.textPrimary}]}
          numberOfLines={1}>
          {title}
        </Text>
      </View>
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
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.headGap,
    paddingVertical: m.headPadV,
    paddingHorizontal: m.headPadH,
    borderBottomWidth: 1,
  },
  back: {
    width: m.headBackSize,
    height: m.headBackSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    fontSize: m.headTitleSize,
    fontWeight: m.headTitleWeight,
  },
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
