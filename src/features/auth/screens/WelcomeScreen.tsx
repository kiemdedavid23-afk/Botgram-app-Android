import React from 'react';
import {
  View,
  Text,
  Pressable,
  Image,
  StatusBar,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {ArrowRight} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {BotgramLogo} from '../../../shared/components/BotgramLogo';
import {welcomeColors, welcomeMetrics} from '../../../shared/theme/authColors';
import {texts} from '../texts';

// Visuel dérivé de l'affiche « Botsgram » (recadré, sans texte intégré, fondu haut/bas).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const heroImage = require('../../../assets/welcome_hero.webp');

type Props = {onContinue: () => void};

export function WelcomeScreen({onContinue}: Props): React.JSX.Element {
  const {width, height} = useWindowDimensions();
  const naturalHeight = width * welcomeMetrics.heroRatio;
  const heroHeight = Math.min(
    Math.max(naturalHeight, height * welcomeMetrics.heroMinScreenShare),
    naturalHeight * welcomeMetrics.heroMaxStretch,
  );
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      <Image
        source={heroImage}
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          width,
          height: heroHeight,
        }}
        resizeMode="cover"
        accessible={false}
      />

      <View
        style={[
          styles.content,
          {paddingTop: insets.top + welcomeMetrics.contentPaddingTop},
        ]}>
        <View style={styles.logoWrap}>
          <BotgramLogo size={welcomeMetrics.logoSize} tone="vivid" />
        </View>
        <Text style={styles.brand} accessibilityRole="header">
          <Text style={styles.brandStart}>{texts.welcomeBrandStart}</Text>
          <Text style={styles.brandEnd}>{texts.welcomeBrandEnd}</Text>
        </Text>
        <Text style={styles.headline}>
          {texts.welcomeHeadline}
          {'\n'}
          <Text style={styles.headlineAccent}>{texts.welcomeHeadlineAccent}</Text>
        </Text>
        <Text style={styles.sub}>{texts.welcomeSubtitle}</Text>
      </View>

      <View
        style={[
          styles.footer,
          {paddingBottom: insets.bottom + welcomeMetrics.footerPaddingBottom},
        ]}>
        <Pressable
          style={({pressed}) => [styles.button, pressed && styles.buttonPressed]}
          onPress={onContinue}
          accessibilityRole="button"
          accessibilityLabel={texts.welcomeCta}>
          <Text style={styles.buttonText}>{texts.welcomeCta}</Text>
          <ArrowRight size={20} color={welcomeColors.buttonText} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: welcomeColors.bg},
  content: {
    alignItems: 'center',
    paddingHorizontal: welcomeMetrics.contentPaddingH,
  },
  logoWrap: {
    width: welcomeMetrics.logoSize,
    height: welcomeMetrics.logoSize,
    borderRadius: welcomeMetrics.logoSize * 0.225,
    overflow: 'hidden',
    marginBottom: welcomeMetrics.logoMarginBottom,
    shadowColor: welcomeColors.buttonShadow,
    shadowOpacity: 1,
    shadowRadius: 24,
    shadowOffset: {width: 0, height: 8},
    elevation: 10,
  },
  brand: {
    fontSize: welcomeMetrics.brandSize,
    fontWeight: '700',
    letterSpacing: -0.5,
    marginBottom: 18,
  },
  brandStart: {color: welcomeColors.title},
  brandEnd: {color: welcomeColors.accent},
  headline: {
    fontSize: welcomeMetrics.headlineSize,
    lineHeight: welcomeMetrics.headlineLineHeight,
    fontWeight: '700',
    color: welcomeColors.title,
    textAlign: 'center',
    marginBottom: 10,
  },
  headlineAccent: {color: welcomeColors.accent},
  sub: {
    fontSize: welcomeMetrics.subtitleSize,
    lineHeight: welcomeMetrics.subtitleLineHeight,
    color: welcomeColors.subtitle,
    textAlign: 'center',
    maxWidth: welcomeMetrics.subtitleMaxWidth,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: welcomeMetrics.footerPaddingH,
  },
  button: {
    height: welcomeMetrics.buttonHeight,
    borderRadius: welcomeMetrics.buttonRadius,
    backgroundColor: welcomeColors.buttonBg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: welcomeColors.buttonShadow,
    shadowOpacity: 1,
    shadowRadius: 18,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
  buttonPressed: {opacity: 0.85},
  buttonText: {
    color: welcomeColors.buttonText,
    fontSize: welcomeMetrics.buttonFontSize,
    fontWeight: '600',
  },
});
