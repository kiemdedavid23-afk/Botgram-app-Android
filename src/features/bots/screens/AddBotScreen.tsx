/**
 * Écran « Ajouter un bot » — AddBotPage.css (carte Associer uniquement).
 * Appui Associer : inerte en L3a (parcours L3b).
 */
import React, {useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated, ScrollView} from 'react-native';
import {Link2, ChevronRight} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';
import {texts} from '../../dashboard/texts';

type Props = {
  onBack: () => void;
};

export function AddBotScreen({onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const scale = useRef(new Animated.Value(1)).current;

  return (
    <SettingsShell title={texts.addBot} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.content}
        style={{backgroundColor: colors.bgSecondary}}>
        <Text style={[styles.intro, {color: colors.textSecondary}]}>
          {texts.addBotIntro}
        </Text>
        <Pressable
          onPressIn={() => {
            Animated.timing(scale, {
              toValue: dm.pressScale,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }}
          onPressOut={() => {
            Animated.timing(scale, {
              toValue: 1,
              duration: 150,
              useNativeDriver: true,
            }).start();
          }}
          onPress={() => {
            // L3a : inerte — parcours d'association en L3b
          }}>
          <Animated.View
            style={[
              styles.card,
              {
                backgroundColor: colors.bgPrimary,
                transform: [{scale}],
              },
            ]}>
            <View style={[styles.iconBox, {backgroundColor: colors.accent}]}>
              <Link2 size={dm.addbotIconSize} color="#ffffff" />
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
      </ScrollView>
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingHorizontal: dm.addbotPadH,
    paddingTop: dm.addbotPadTop,
    paddingBottom: dm.addbotPadBottom,
    gap: dm.addbotGap,
  },
  intro: {
    fontSize: dm.addbotIntroSize,
    lineHeight: dm.addbotIntroSize * 1.45,
    paddingHorizontal: 4,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: dm.addbotCardRadius,
    padding: dm.addbotCardPad,
    gap: dm.addbotCardGap,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  iconBox: {
    width: dm.addbotIconBox,
    height: dm.addbotIconBox,
    borderRadius: dm.addbotIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {flex: 1, gap: 4},
  title: {fontSize: dm.addbotTitleSize, fontWeight: '600'},
  desc: {
    fontSize: dm.addbotDescSize,
    lineHeight: dm.addbotDescSize * 1.4,
  },
  help: {
    fontSize: dm.addbotHelpSize,
    paddingHorizontal: 4,
  },
});
