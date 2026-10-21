/**
 * Boîte de confirmation Gestion — .g-dialog (GestionPage.css).
 */
import React from 'react';
import {View, Text, Pressable, Modal, StyleSheet} from 'react-native';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import {texts} from '../texts';

type Props = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel?: string;
  danger?: boolean;
  extra?: React.ReactNode;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  body,
  confirmLabel,
  danger,
  extra,
  busy,
  onCancel,
  onConfirm,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View
          style={[
            styles.dialog,
            {backgroundColor: colors.bgPrimary},
            getShadow('md', mode),
          ]}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>{title}</Text>
          <Text style={[styles.body, {color: colors.textSecondary}]}>{body}</Text>
          {extra}
          <View style={styles.actions}>
            <Pressable
              onPress={onCancel}
              disabled={busy}
              style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
              <Text style={[styles.btnText, {color: colors.textPrimary}]}>
                {texts.cancel}
              </Text>
            </Pressable>
            <Pressable
              onPress={onConfirm}
              disabled={busy}
              style={[
                styles.btn,
                {backgroundColor: danger ? colors.danger : colors.accent},
              ]}>
              <Text style={[styles.btnText, {color: colors.white}]}>
                {confirmLabel ?? texts.confirm}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: g.dialogPad,
  },
  dialog: {
    width: '100%',
    maxWidth: g.dialogMaxWidth,
    borderRadius: g.dialogRadius,
    paddingTop: g.dialogPad,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    paddingHorizontal: g.dialogPad,
  },
  body: {
    fontSize: 14,
    lineHeight: 21,
    paddingHorizontal: g.dialogPad,
    paddingTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 10,
    padding: 14,
    paddingHorizontal: g.dialogPad,
  },
  btn: {
    flex: 1,
    height: g.btnHeight,
    borderRadius: g.btnRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontSize: g.btnFont, fontWeight: '700'},
});
