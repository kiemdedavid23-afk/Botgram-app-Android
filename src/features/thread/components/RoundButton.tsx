/** Bouton rond blanc flottant de l'en-tête de conversation (← et ⋮). */
import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {useTheme, getShadow, radii} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';

type Props = {
  label: string;
  onPress: () => void;
  expanded?: boolean;
  children: React.ReactNode;
};

export function RoundButton({
  label,
  onPress,
  expanded,
  children,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={expanded === undefined ? undefined : {expanded}}
      onPress={onPress}
      hitSlop={tm.headerHitSlop}
      style={[
        styles.btn,
        {backgroundColor: colors.bgPrimary},
        getShadow('sm', mode),
      ]}>
      {children}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: tm.floatBtnSize,
    height: tm.floatBtnSize,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
