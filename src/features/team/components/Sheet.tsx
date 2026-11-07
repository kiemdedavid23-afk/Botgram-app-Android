import React from 'react';
import {Modal, View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, StyleSheet} from 'react-native';
import {useTeamPalette, type TeamPalette} from './teamPalette';

type SheetProps = {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
};

/** Feuille du bas, fermable au toucher extérieur et au retour Android. */
export function Sheet({visible, title, onClose, children}: SheetProps): React.JSX.Element {
  const p = useTeamPalette();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={[styles.overlay, {backgroundColor: p.overlay}]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.sheet, {backgroundColor: p.surface, borderTopLeftRadius: p.radius + 6, borderTopRightRadius: p.radius + 6}]}>
          <Text style={[styles.title, {color: p.ink, fontFamily: p.titleFont}]}>{title}</Text>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

type ConfirmProps = {
  visible: boolean;
  title: string;
  body: string;
  confirmLabel: string;
  danger?: boolean;
  busy?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

export function ConfirmBox({visible, title, body, confirmLabel, danger, busy, onCancel, onConfirm}: ConfirmProps): React.JSX.Element {
  const p = useTeamPalette();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <View style={[styles.center, {backgroundColor: p.overlay}]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onCancel} />
        <View style={[styles.dialog, {backgroundColor: p.surface, borderRadius: p.radius}]}>
          <Text style={[styles.dTitle, {color: p.ink, fontFamily: p.titleFont}]}>{title}</Text>
          <Text style={[styles.dBody, {color: p.inkSoft}]}>{body}</Text>
          <View style={styles.dActions}>
            <Button p={p} label="Annuler" kind="ghost" disabled={busy} onPress={onCancel} />
            <Button p={p} label={confirmLabel} kind={danger ? 'danger' : 'primary'} disabled={busy} onPress={onConfirm} />
          </View>
        </View>
      </View>
    </Modal>
  );
}

export function Button({
  p,
  label,
  kind = 'primary',
  disabled,
  onPress,
}: {
  p: TeamPalette;
  label: string;
  kind?: 'primary' | 'ghost' | 'danger';
  disabled?: boolean;
  onPress: () => void;
}): React.JSX.Element {
  const bg = kind === 'primary' ? p.accent : kind === 'danger' ? p.danger : p.surfaceAlt;
  const fg = kind === 'ghost' ? p.ink : p.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.btn, {backgroundColor: bg, borderRadius: p.radius, opacity: disabled ? 0.5 : 1}]}>
      <Text style={[styles.btnText, {color: fg, fontFamily: p.labelFont}]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {maxHeight: '90%', paddingTop: 18},
  title: {fontSize: 19, fontWeight: '700', paddingHorizontal: 18, paddingBottom: 8},
  body: {paddingHorizontal: 18, paddingBottom: 28, gap: 14},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
  dialog: {width: '100%', maxWidth: 420, padding: 18, gap: 8},
  dTitle: {fontSize: 18, fontWeight: '700'},
  dBody: {fontSize: 14, lineHeight: 21},
  dActions: {flexDirection: 'row', gap: 10, marginTop: 10},
  btn: {flex: 1, paddingVertical: 13, alignItems: 'center', justifyContent: 'center'},
  btnText: {fontSize: 14, fontWeight: '700'},
});
