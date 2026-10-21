/**
 * Ready — AssociateReadyPage.tsx.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {CheckCircle2} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {texts} from '../texts';

type Props = {onNext: () => void; onBack: () => void};

export function AssociateReadyScreen({
  onNext,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <AssociateShell title={texts.readyTitle} step={2} onBack={onBack}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <View style={styles.row}>
          <CheckCircle2 size={m.readyIcon} color={colors.accent} />
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
            {texts.readyCardTitle}
          </Text>
        </View>
        <Text style={[styles.body, {color: colors.textSecondary}]}>
          {texts.readyBody}
        </Text>
        <Text style={[styles.link, {color: colors.accent}]}>
          {texts.readyGuide}
        </Text>
      </View>
      <Pressable
        onPress={onNext}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        <Text style={[styles.btnText, {color: colors.white}]}>
          {texts.continue}
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
    gap: m.pointGap + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.readyRowGap,
  },
  cardTitle: {fontSize: m.cardTitleSize, fontWeight: m.cardTitleWeight},
  body: {fontSize: m.cardTextSize, lineHeight: m.cardTextLine},
  link: {fontSize: m.linkFont, fontWeight: m.weight500},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
