/**
 * Done — AssociateDonePage.tsx.
 */
import React, {useEffect} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {CheckCircle2} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore} from '../store/associateStore';
import {texts} from '../texts';

type Props = {onHome: () => void};

export function AssociateDoneScreen({onHome}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const reset = useAssociateStore(s => s.reset);

  useEffect(() => {
    return () => {
      reset();
    };
  }, [reset]);

  return (
    <AssociateShell title={texts.doneTitle} step={5}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <CheckCircle2 size={m.doneIcon} color={colors.success} />
        <Text style={[styles.title, {color: colors.textPrimary}]}>
          {texts.doneTitle}
        </Text>
        <Text style={[styles.body, {color: colors.textSecondary}]}>
          {texts.doneBody}
        </Text>
      </View>
      <Pressable
        onPress={() => {
          reset();
          onHome();
        }}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        <Text style={[styles.btnText, {color: colors.white}]}>
          {texts.doneHome}
        </Text>
      </Pressable>
    </AssociateShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: m.cardRadius,
    padding: m.cardPad,
    elevation: m.shadowElevation,
    shadowOpacity: m.shadowOpacity,
    shadowRadius: m.shadowRadius,
    shadowOffset: {width: 0, height: m.shadowOffsetY},
    alignItems: 'center',
    gap: m.pointGap + 2,
  },
  title: {fontSize: m.cardTitleSize, fontWeight: m.cardTitleWeight},
  body: {
    fontSize: m.cardTextSize,
    lineHeight: m.cardTextLine,
    textAlign: 'center',
  },
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
