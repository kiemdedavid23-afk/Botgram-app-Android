/**
 * Verify — AssociateVerifyPage.tsx.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore, type VerifyResult} from '../store/associateStore';
import {texts, verifyMessage} from '../texts';

type Props = {
  result: VerifyResult;
  onConfirm: () => void;
  onBackToken: () => void;
  onBack: () => void;
};

const ADVANCE: ReadonlySet<VerifyResult> = new Set([
  'ok',
  'replace_required',
]);

export function AssociateVerifyScreen({
  result,
  onConfirm,
  onBackToken,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const preview = useAssociateStore(s => s.preview);
  const canAdvance = ADVANCE.has(result);
  const isError = !canAdvance;

  return (
    <AssociateShell title={texts.verifyTitle} step={4} onBack={onBack}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        {preview && canAdvance ? (
          <View style={styles.preview}>
            <View
              style={[styles.avatar, {backgroundColor: colors.accentSoft}]}>
              <Text style={[styles.avatarText, {color: colors.accent}]}>
                {(preview.name || 'B').charAt(0).toUpperCase()}
              </Text>
            </View>
            <View style={styles.meta}>
              <Text style={[styles.name, {color: colors.textPrimary}]}>
                {preview.name}
              </Text>
              {preview.username ? (
                <Text style={[styles.user, {color: colors.textSecondary}]}>
                  @{preview.username}
                </Text>
              ) : null}
            </View>
          </View>
        ) : null}
        <View
          style={[
            styles.msg,
            {
              backgroundColor: isError
                ? colors.dangerSoft
                : colors.successSoft,
            },
          ]}>
          <Text
            style={[
              styles.msgText,
              {color: isError ? colors.danger : colors.successText},
            ]}>
            {verifyMessage(result)}
          </Text>
        </View>
      </View>
      {canAdvance ? (
        <Pressable
          onPress={onConfirm}
          style={[styles.btn, {backgroundColor: colors.accent}]}>
          <Text style={[styles.btnText, {color: colors.white}]}>
            {texts.nextConfirm}
          </Text>
        </Pressable>
      ) : null}
      <Pressable
        onPress={onBackToken}
        style={[styles.ghost, {borderColor: colors.border}]}>
        <Text style={[styles.ghostText, {color: colors.accent}]}>
          {texts.backToken}
        </Text>
      </Pressable>
    </AssociateShell>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: m.cardRadius,
    padding: m.cardPad,
    elevation: m.shadowElevation,
    shadowOpacity: m.shadowOpacity,
    shadowRadius: m.shadowRadius,
    shadowOffset: {width: 0, height: m.shadowOffsetY},
    gap: m.previewGap,
  },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.previewGap,
  },
  avatar: {
    width: m.avatar,
    height: m.avatar,
    borderRadius: m.avatar / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: m.avatarFont, fontWeight: m.weight600},
  meta: {flex: 1},
  name: {
    fontSize: m.botNameSize,
    fontWeight: m.weight600,
    marginBottom: 2,
  },
  user: {fontSize: m.botUserSize},
  msg: {
    paddingVertical: m.bannerPadV,
    paddingHorizontal: m.bannerPadH,
    borderRadius: m.bannerRadius,
  },
  msgText: {fontSize: m.cardTextSize},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
  ghost: {
    borderWidth: 1,
    borderRadius: m.btnRadius,
    paddingVertical: m.ghostPadV,
    alignItems: 'center',
  },
  ghostText: {fontSize: m.ghostFont, fontWeight: m.weight600},
});
