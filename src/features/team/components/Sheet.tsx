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
        <View
          style={[
            styles.sheet,
            {backgroundColor: p.surface, borderTopLeftRadius: p.sheetRadius, borderTopRightRadius: p.sheetRadius},
          ]}>
          {p.company ? <View style={[styles.handle, {backgroundColor: p.fieldBorder}]} /> : null}
          <Text
            style={[
              styles.title,
              {color: p.ink, fontFamily: p.titleFont, fontSize: p.company ? 22 : 19, paddingHorizontal: p.company ? 22 : 18},
            ]}>
            {title}
          </Text>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.body, {paddingHorizontal: p.company ? 22 : 18}]}>
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
        <View
          style={[
            styles.dialog,
            {backgroundColor: p.surface, borderRadius: p.cardRadius, padding: p.company ? 22 : 18},
          ]}>
          <Text style={[styles.dTitle, {color: p.ink, fontFamily: p.titleFont, fontSize: p.company ? 21 : 18}]}>{title}</Text>
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
  // Entreprise : le bouton discret est à contour (comme « Lier un nouveau bot ») ; sinon fond de surface.
  const ghostBg = p.company ? 'transparent' : p.surfaceAlt;
  const bg = kind === 'primary' ? p.accent : kind === 'danger' ? p.danger : ghostBg;
  const fg = kind === 'ghost' ? p.ink : p.onAccent;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.btn,
        {
          backgroundColor: bg,
          borderRadius: p.radius,
          borderWidth: kind === 'ghost' && p.company ? 1 : 0,
          borderColor: p.ghostBorder,
          paddingVertical: p.company ? 15 : 13,
          opacity: disabled ? 0.5 : pressed ? 0.8 : 1,
        },
      ]}>
      <Text style={[styles.btnText, {color: fg, fontFamily: p.labelFont, fontSize: p.company ? 15 : 14}]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {maxHeight: '90%', paddingTop: 18},
  handle: {alignSelf: 'center', width: 44, height: 5, borderRadius: 3, marginBottom: 14, marginTop: -6},
  title: {fontWeight: '700', paddingBottom: 10},
  body: {paddingBottom: 28, gap: 14},
  center: {flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20},
  dialog: {width: '100%', maxWidth: 420, gap: 8},
  dTitle: {fontWeight: '700'},
  dBody: {fontSize: 14, lineHeight: 21},
  dActions: {flexDirection: 'row', gap: 10, marginTop: 10},
  btn: {flex: 1, alignItems: 'center', justifyContent: 'center'},
  btnText: {fontWeight: '700'},
});
