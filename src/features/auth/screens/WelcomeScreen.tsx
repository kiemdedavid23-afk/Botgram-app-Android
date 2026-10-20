import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {BotgramLogo} from '../../../shared/components/BotgramLogo';
import {authColors, authMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';

type Props = {onContinue: () => void};

export function WelcomeScreen({onContinue}: Props): React.JSX.Element {
  return (
    <View style={styles.root}>
      <View style={styles.logoWrap}>
        <BotgramLogo size={authMetrics.logoSize} />
      </View>
      <Text style={styles.title}>{texts.welcomeTitle}</Text>
      <Text style={styles.sub}>{texts.welcomeSubtitle}</Text>
      <Pressable style={styles.fab} onPress={onContinue} accessibilityLabel="Commencer">
        <ArrowRight size={26} color={authColors.white} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: authColors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingBottom: 96,
  },
  logoWrap: {
    width: authMetrics.logoSize,
    height: authMetrics.logoSize,
    borderRadius: authMetrics.logoRadius,
    overflow: 'hidden',
    marginBottom: authMetrics.logoMarginBottom,
    shadowColor: authColors.logoShadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 8},
    elevation: 8,
  },
  title: {
    fontSize: authMetrics.titleSize,
    fontWeight: authMetrics.titleWeight,
    color: authColors.text,
    marginBottom: 10,
  },
  sub: {
    fontSize: authMetrics.subtitleSize,
    color: authColors.textMuted,
    lineHeight: authMetrics.subtitleSize * authMetrics.subtitleLineHeight,
    maxWidth: authMetrics.subtitleMaxWidth,
    textAlign: 'center',
  },
  fab: {
    position: 'absolute',
    right: authMetrics.fabRight,
    bottom: authMetrics.fabBottom,
    width: authMetrics.fabSize,
    height: authMetrics.fabSize,
    borderRadius: authMetrics.fabSize / 2,
    backgroundColor: authColors.fabBg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: authColors.fabShadow,
    shadowOpacity: 1,
    shadowRadius: 14,
    shadowOffset: {width: 0, height: 4},
    elevation: 6,
  },
});
