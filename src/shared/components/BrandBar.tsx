/**
 * Barre de marque 56 px — titre accent, padding 0 12 0 14.
 * Référence : BrandBar.css + tokens.
 */
import React, {type ReactNode} from 'react';
import {
  View,
  Text,
  StatusBar,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, space, fontSize, fontWeight, brandBarMetrics as bm} from '../theme';
import {statusBarColors} from '../theme/statusBar';

type Props = {
  title?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function BrandBar({
  title = 'Botgram',
  right,
  style,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();

  // Bandeau derrière la barre d'état : bleu de marque en clair (comme le site).
  const stripColor =
    mode === 'dark' ? colors.bgPrimary : statusBarColors.light;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPrimary,
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      <StatusBar barStyle="light-content" />
      <View style={{height: insets.top, backgroundColor: stripColor}} />
      <View style={styles.inner}>
        <Text
          style={[styles.title, {color: colors.accent}]}
          numberOfLines={1}>
          {title}
        </Text>
        {right ? <View style={styles.right}>{right}</View> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inner: {
    height: space.brandBarHeight,
    paddingLeft: space.brandBarPaddingLeft,
    paddingRight: space.brandBarPaddingRight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: fontSize.brandTitle,
    fontWeight: fontWeight.bold,
    letterSpacing: bm.titleLetterSpacing,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bm.rightGap,
  },
});
