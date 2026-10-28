/**
 * Barre de marque 56 px — titre accent, padding 0 12 0 14.
 * Référence : BrandBar.css + tokens.
 */
import React, {type ReactNode} from 'react';
import {View, Text, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {useTheme, space, fontSize, fontWeight, brandBarMetrics as bm} from '../theme';
import {StatusBarStrip} from './StatusBarStrip';

type Props = {
  title?: string;
  right?: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Style Telegram : barre d'état fondue, titre sobre, pas de trait de séparation. */
  seamless?: boolean;
};

export function BrandBar({
  title = 'Botgram',
  right,
  style,
  seamless = false,
}: Props): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPrimary,
          borderBottomColor: colors.border,
        },
        seamless ? styles.noBorder : null,
        style,
      ]}>
      <StatusBarStrip seamless={seamless} />
      <View style={styles.inner}>
        <Text
          style={[
            styles.title,
            seamless
              ? {color: colors.textPrimary, fontSize: fontSize.brandTitle + 4}
              : {color: colors.accent},
          ]}
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
  noBorder: {borderBottomWidth: 0},
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
