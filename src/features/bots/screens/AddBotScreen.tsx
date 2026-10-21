/**
 * Écran « Ajouter un bot » — AddBotPage.tsx / AddBotPage.css.
 */
import React, {useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated} from 'react-native';
import {Link2, ChevronRight} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {
  useTheme,
  dashboardMetrics as dm,
} from '../../../shared/theme';
import {texts} from '../../dashboard/texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type Props = {
  onBack: () => void;
  onAssociate: () => void;
};

export function AddBotScreen({onBack, onAssociate}: Props): React.JSX.Element {
  const {colors} = useTheme();
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
    <SettingsShell title={texts.addBot} onBack={onBack}>
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
              <Link2 size={dm.addbotIconSize} color={colors.white} />
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
    </SettingsShell>
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
    borderRadius: dm.addbotCardRadius,
    elevation: dm.shadowElevation,
    shadowOpacity: dm.shadowOpacity,
    shadowRadius: dm.shadowRadius,
    shadowOffset: {width: 0, height: dm.shadowOffsetY},
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
