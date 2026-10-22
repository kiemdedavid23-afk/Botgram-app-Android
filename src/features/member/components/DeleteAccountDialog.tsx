/**
 * Suppression de compte en 2 étapes — MemberProfilePage.tsx dialog.
 * Code jamais loggé ni persisté ; effacé à la fermeture / succès.
 * code_length depuis le Worker (store.deleteCodeLength).
 */
import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  Pressable,
  Modal,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import {useMemberStore} from '../store/memberStore';
import {texts} from '../texts';
import {mapDeleteError} from '../utils/deleteErrors';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Step = 'confirm' | 'code';

type Props = {
  visible: boolean;
  email: string;
  onClose: () => void;
};

export function DeleteAccountDialog({
  visible,
  email,
  onClose,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const deletePhase = useMemberStore(s => s.deletePhase);
  const deleteError = useMemberStore(s => s.deleteError);
  const deleteCodeLength = useMemberStore(s => s.deleteCodeLength);
  const requestAccountDelete = useMemberStore(s => s.requestAccountDelete);
  const confirmAccountDelete = useMemberStore(s => s.confirmAccountDelete);
  const resetDelete = useMemberStore(s => s.resetDelete);

  const [step, setStep] = useState<Step>('confirm');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const codeRef = useRef(code);
  codeRef.current = code;

  useEffect(() => {
    if (visible) {
      setStep('confirm');
      setCode('');
      setLocalError(null);
      setBusy(false);
    } else {
      setCode('');
      resetDelete();
    }
  }, [visible, resetDelete]);

  useEffect(() => {
    if (deletePhase === 'code_sent' && step === 'confirm') {
      setStep('code');
    }
  }, [deletePhase, step]);

  const close = () => {
    setCode('');
    setLocalError(null);
    resetDelete();
    onClose();
  };

  const onSendCode = async () => {
    setBusy(true);
    setLocalError(null);
    const r = await requestAccountDelete('fr');
    setBusy(false);
    if (r !== 'ok') {
      setLocalError(mapDeleteError(useMemberStore.getState().deleteError));
    }
  };

  const onConfirm = async () => {
    const c = codeRef.current.replace(/\D/g, '');
    if (c.length < deleteCodeLength) {
      setLocalError(texts.errorCodeInvalid);
      return;
    }
    setBusy(true);
    setLocalError(null);
    const r = await confirmAccountDelete(c);
    setBusy(false);
    setCode('');
    if (r === 'ok') {
      close();
      return;
    }
    setLocalError(
      mapDeleteError(
        r === 'code_invalid'
          ? 'CODE_INVALID'
          : r === 'cleanup_pending'
            ? 'ACCOUNT_CLEANUP_PENDING'
            : useMemberStore.getState().deleteError,
      ),
    );
  };

  const errMsg = localError ?? (deleteError ? mapDeleteError(deleteError) : null);
  const isDeleting = deletePhase === 'deleting' || busy;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={close}>
      <View
        style={[
          styles.overlay,
          {backgroundColor: colors.overlay},
        ]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} />
        <View
          style={[
            styles.dialog,
            {backgroundColor: colors.bgPrimary},
            getShadow('md', mode),
          ]}>
          <Text style={[styles.title, {color: colors.textPrimary}]}>
            {texts.deleteConfirmTitle}
          </Text>
          {step === 'confirm' ? (
            <Text style={[styles.body, {color: colors.textSecondary}]}>
              {texts.deleteConfirmBody} {email}.
            </Text>
          ) : (
            <>
              <Text style={[styles.body, {color: colors.textSecondary}]}>
                {texts.deleteCodeBody} {deleteCodeLength}{' '}
                {texts.deleteCodeBodySuffix} {email}.
              </Text>
              <TextInput
                value={code}
                onChangeText={t =>
                  setCode(t.replace(/\D/g, '').slice(0, deleteCodeLength))
                }
                keyboardType="number-pad"
                maxLength={deleteCodeLength}
                placeholder={texts.deleteCodePlaceholder.slice(
                  0,
                  deleteCodeLength,
                )}
                placeholderTextColor={colors.textHint}
                secureTextEntry={false}
                autoComplete="one-time-code"
                style={[
                  styles.input,
                  {
                    borderColor: colors.border,
                    backgroundColor: colors.bgSecondary,
                    color: colors.textPrimary,
                  },
                ]}
              />
            </>
          )}
          {errMsg ? (
            <Text style={[styles.err, {color: colors.danger}]} role="alert">
              {errMsg}
            </Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              onPress={close}
              disabled={isDeleting}
              style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
              <Text style={[styles.btnText, {color: colors.textPrimary}]}>
                {texts.cancel}
              </Text>
            </Pressable>
            {step === 'confirm' ? (
              <Pressable
                onPress={() => {
                  fireAndForget(onSendCode());
                }}
                disabled={isDeleting}
                style={[styles.btn, {backgroundColor: colors.danger}]}>
                {isDeleting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={[styles.btnText, {color: colors.white}]}>
                    {texts.deleteSendCode}
                  </Text>
                )}
              </Pressable>
            ) : (
              <Pressable
                onPress={() => {
                  fireAndForget(onConfirm());
                }}
                disabled={isDeleting}
                style={[styles.btn, {backgroundColor: colors.danger}]}>
                {isDeleting ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <Text style={[styles.btnText, {color: colors.white}]}>
                    {texts.deleteConfirmBtn}
                  </Text>
                )}
              </Pressable>
            )}
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
    padding: 24,
  },
  dialog: {
    width: '100%',
    maxWidth: m.dialogMaxWidth,
    borderRadius: m.dialogRadius,
    paddingTop: m.dialogPadTop,
  },
  title: {
    fontSize: m.dialogTitleSize,
    fontWeight: '700',
    paddingHorizontal: m.dialogPadH,
  },
  body: {
    fontSize: m.dialogBodySize,
    lineHeight: 21,
    paddingHorizontal: m.dialogPadH,
    paddingTop: 8,
  },
  input: {
    marginHorizontal: m.dialogPadH,
    marginTop: 12,
    height: m.fieldInputHeight,
    borderRadius: m.fieldInputRadius,
    borderWidth: m.fieldInputBorder,
    paddingHorizontal: m.fieldInputPadH,
    fontSize: m.fieldInputFont,
    letterSpacing: 4,
    textAlign: 'center',
  },
  err: {
    fontSize: 13,
    paddingHorizontal: m.dialogPadH,
    paddingTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: m.sheetActionsGap,
    padding: m.sheetActionsPad,
    paddingHorizontal: m.sheetActionsPadH,
    paddingBottom: m.sheetActionsPadBottom,
  },
  btn: {
    flex: 1,
    height: m.btnHeight,
    borderRadius: m.btnRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: m.btnFont,
    fontWeight: '700',
  },
});
