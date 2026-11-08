/**
 * Écran « Ajouter un bot » — AddBotPage.tsx / AddBotPage.css.
 */
import React, {useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated} from 'react-native';
import {Link2, ChevronRight} from 'lucide-react-native';
import {dashboardMetrics as dm} from '../../../shared/theme';
import {useFlowColors} from '../../accounts/company/flowColors';
import {companyMetrics as cm} from '../../accounts/company/companyTheme';
import {FlowPage} from '../../accounts/company/components/FlowPage';
import {texts} from '../../dashboard/texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type Props = {
  onBack: () => void;
  onAssociate: () => void;
};

export function AddBotScreen({onBack, onAssociate}: Props): React.JSX.Element {
  const colors = useFlowColors();
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(1)).current;

  const animatePress = (to: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: to,
      duration: dm.pressDurationMs,
      useNativeDriver: true,
    }).start();
  };

  return (
    <FlowPage title={texts.addBot} onBack={onBack}>
      <View style={styles.body}>
        <Text style={[styles.intro, {color: colors.textSecondary}]}>
          {texts.addBotIntro}
        </Text>
        <Pressable
          onPressIn={() => animatePress(dm.pressScale)}
          onPressOut={() => animatePress(1)}
          onPress={onAssociate}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgPrimary,
                shadowColor: colors.black,
                transform: [{scale}],
              },
            ]}>
            <View style={[styles.icon, {backgroundColor: colors.accent}]}>
              <Link2 size={dm.addbotIconSize} color={colors.onAccent} />
            </View>
            <View style={styles.meta}>
              <Text style={[styles.title, {color: colors.textPrimary}]}>
                {texts.associateTitle}
              </Text>
              <Text style={[styles.desc, {color: colors.textSecondary}]}>
                {texts.associateDesc}
              </Text>
            </View>
            <ChevronRight size={20} color={colors.textHint} />
          </Animated.View>
        </Pressable>
        <Text style={[styles.help, {color: colors.textSecondary}]}>
          {texts.associateHelp}
        </Text>
      </View>
    </FlowPage>
  );
}

const styles = StyleSheet.create({
  body: {
    paddingHorizontal: dm.addbotPadH,
    paddingTop: dm.addbotPadTop,
    paddingBottom: dm.addbotPadBottom,
    gap: dm.addbotGap,
  },
  intro: {fontSize: dm.addbotIntroSize, lineHeight: 22},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dm.addbotCardGap,
    padding: dm.addbotCardPad,
    borderRadius: cm.cardRadius,
    elevation: 3,
    shadowOpacity: 0.1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 8},
  },
  icon: {
    width: dm.addbotIconBox,
    height: dm.addbotIconBox,
    borderRadius: dm.addbotIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {flex: 1, gap: 4},
  title: {fontSize: dm.addbotTitleSize, fontWeight: '600'},
  desc: {fontSize: dm.addbotDescSize, lineHeight: 20},
  help: {fontSize: dm.addbotHelpSize, lineHeight: 18, paddingHorizontal: 4},
});
