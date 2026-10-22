/**
 * Barre enregistrer / annuler — SaveBar site.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {texts} from '../texts';

type Props = {
  visible: boolean;
  saving: boolean;
  onSave: () => void;
  onDiscard: () => void;
};

export function SaveBar({
  visible,
  saving,
  onSave,
  onDiscard,
}: Props): React.JSX.Element | null {
  const {colors} = useTheme();
  if (!visible) return null;
  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.bgPrimary,
          borderTopColor: colors.borderSoft,
        },
      ]}>
      <Pressable
        onPress={onDiscard}
        disabled={saving}
        style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
        <Text style={[styles.btnText, {color: colors.textPrimary}]}>
          {texts.discard}
        </Text>
      </Pressable>
      <Pressable
        onPress={onSave}
        disabled={saving}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        {saving ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.btnText, {color: colors.white}]}>
            {texts.save}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    gap: m.saveBarGap,
    padding: m.saveBarPad,
    borderTopWidth: m.saveBarBorderWidth,
  },
  btn: {
    flex: 1,
    height: m.saveBarHeight - m.saveBarBtnHeightOffset,
    borderRadius: m.inputRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontWeight: m.saveBarBtnWeight, fontSize: m.saveBarBtnFontSize},
});
