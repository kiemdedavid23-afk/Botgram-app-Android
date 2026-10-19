/**
 * Barre de marque 56 px — titre accent, padding 0 12 0 14.
 * Référence : BrandBar.css + tokens.
 */
import React, {type ReactNode} from 'react';
import {View, Text, StyleSheet, type StyleProp, type ViewStyle} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, space, fontSize, fontWeight} from '../theme';

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
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top,
          backgroundColor: colors.bgPrimary,
          borderBottomColor: colors.border,
        },
        style,
      ]}>
      <View style={styles.inner}>
        <Text
          style={[
            styles.title,
            {color: colors.accent},
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
    letterSpacing: -0.3,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});
