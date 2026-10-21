/**
 * Intro — AssociateIntroPage.tsx + AssociateFlow.css.
 * Imports : ../components, ../store, ../texts, ../../../shared/theme
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Key, Shield, Link2, EyeOff} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore} from '../store/associateStore';
import {texts} from '../texts';

type Props = {onNext: () => void; onBack: () => void};

const POINTS: ReadonlyArray<{Icon: typeof Key; text: string}> = [
  {Icon: Key, text: texts.point1},
  {Icon: Shield, text: texts.point2},
  {Icon: Link2, text: texts.point3},
  {Icon: EyeOff, text: texts.point4},
];

export function AssociateIntroScreen({
  onNext,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const acknowledged = useAssociateStore(s => s.acknowledged);
  const setAcknowledged = useAssociateStore(s => s.setAcknowledged);

  return (
    <AssociateShell title={texts.introTitle} step={1} onBack={onBack}>
      <View
        style={[
          styles.banner,
          {backgroundColor: colors.warn + '22', borderLeftColor: colors.warn},
        ]}>
        <Text style={[styles.bannerText, {color: colors.textPrimary}]}>
          {texts.introWelcome}
        </Text>
      </View>

      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
          {texts.introCardTitle}
        </Text>
        {POINTS.map(p => (
          <View key={p.text} style={styles.point}>
            <p.Icon size={m.pointIcon} color={colors.accent} />
            <Text style={[styles.pointText, {color: colors.textSecondary}]}>
              {p.text}
            </Text>
          </View>
        ))}
        {/* Guide complet hors périmètre app — inerte */}
        <Text style={[styles.link, {color: colors.accent}]}>
          {texts.guideLink}
        </Text>
      </View>

      <Pressable
        onPress={() => setAcknowledged(!acknowledged)}
        style={[styles.check, {backgroundColor: colors.bgPrimary}]}>
        <View
          style={[
            styles.box,
            {
              borderColor: colors.accent,
              backgroundColor: acknowledged ? colors.accent : colors.bgPrimary,
            },
          ]}>
          {acknowledged ? (
            <Text style={[styles.tick, {color: colors.white}]}>✓</Text>
          ) : null}
        </View>
        <Text style={[styles.checkText, {color: colors.textPrimary}]}>
          {texts.acknowledge}
        </Text>
      </Pressable>

      {acknowledged ? (
        <View style={[styles.ok, {backgroundColor: colors.successSoft}]}>
          <Text style={[styles.okText, {color: colors.successText}]}>
            {texts.acknowledgeOk}
          </Text>
        </View>
      ) : null}

      <Pressable
        disabled={!acknowledged}
        onPress={onNext}
        style={[
          styles.btn,
          acknowledged ? styles.btnEnabled : styles.btnDisabled,
          {
            backgroundColor: acknowledged ? colors.accent : colors.bgTertiary,
          },
        ]}>
        <Text
          style={[
            styles.btnText,
            {color: acknowledged ? colors.white : colors.textSecondary},
          ]}>
          {texts.continue}
        </Text>
      </Pressable>
    </AssociateShell>
  );
}

const styles = StyleSheet.create({
  banner: {
    borderRadius: m.bannerRadius,
    paddingVertical: m.bannerPadV,
    paddingHorizontal: m.bannerPadH,
    borderLeftWidth: m.bannerLeftBorder,
  },
  bannerText: {fontSize: m.bannerFont},
  card: {
    borderRadius: m.cardRadius,
    padding: m.cardPad,
    elevation: 1,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    gap: m.pointGap,
  },
  cardTitle: {
    fontSize: m.cardTitleSize,
    fontWeight: m.cardTitleWeight,
    marginBottom: 4,
  },
  point: {
    flexDirection: 'row',
    gap: m.pointIconGap,
    alignItems: 'flex-start',
  },
  pointText: {
    flex: 1,
    fontSize: m.cardTextSize,
    lineHeight: m.cardTextLine,
  },
  link: {
    marginTop: 8,
    fontSize: m.linkFont,
    fontWeight: m.weight500,
  },
  check: {
    flexDirection: 'row',
    gap: m.checkGap,
    alignItems: 'flex-start',
    padding: m.checkPad,
    borderRadius: m.bannerRadius,
  },
  box: {
    width: m.checkBox,
    height: m.checkBox,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  tick: {fontSize: m.tickFont, fontWeight: m.weight700, lineHeight: 14},
  checkText: {flex: 1, fontSize: m.checkFont, lineHeight: 22},
  ok: {
    paddingVertical: m.bannerPadV,
    paddingHorizontal: m.bannerPadH,
    borderRadius: m.bannerRadius,
  },
  okText: {fontSize: m.cardTextSize, fontWeight: m.weight500},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnEnabled: {},
  btnDisabled: {opacity: m.btnDisabledOpacity},
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
