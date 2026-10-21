/**
 * Confirm — AssociateConfirmPage.tsx.
 * Sans jeton / preview → navigation.replace AssociateToken.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {AlertTriangle} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore} from '../store/associateStore';
import {texts, confirmError} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';

type Props = {
  onDone: () => void;
  onBack: () => void;
  onNeedToken: () => void;
};

export function AssociateConfirmScreen({
  onDone,
  onBack,
  onNeedToken,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const token = useAssociateStore(s => s.token);
  const preview = useAssociateStore(s => s.preview);
  const confirming = useAssociateStore(s => s.confirming);
  const confirm = useAssociateStore(s => s.confirm);
  const loadBots = useBotsStore(s => s.load);
  const loadQuota = useQuotaStore(s => s.load);
  const replaceRequired = !!preview?.replace_required;
  const [replaceOk, setReplaceOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!token || !preview) {
      onNeedToken();
    }
  }, [token, preview, onNeedToken]);

  const canSubmit =
    !confirming &&
    (!replaceRequired || replaceOk) &&
    !!preview &&
    !!token;

  const onConfirm = () => {
    setErr(null);
    fireAndForget(
      (async () => {
        const res = await confirm(replaceOk);
        if (res.ok) {
          fireAndForget(loadBots(true));
          fireAndForget(loadQuota(true));
          onDone();
          return;
        }
        if (res.reason === 'no_token') {
          onNeedToken();
          return;
        }
        setErr(confirmError(res.reason));
      })(),
    );
  };

  if (!token || !preview) {
    return (
      <AssociateShell title={texts.confirmTitle} step={5} onBack={onBack}>
        <View />
      </AssociateShell>
    );
  }

  const initial = (preview.name || 'B').charAt(0).toUpperCase();

  return (
    <AssociateShell title={texts.confirmTitle} step={5} onBack={onBack}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <View style={styles.preview}>
          <View style={[styles.avatar, {backgroundColor: colors.accentSoft}]}>
            <Text style={[styles.avatarText, {color: colors.accent}]}>
              {initial}
            </Text>
          </View>
          <View style={styles.meta}>
            <Text style={[styles.name, {color: colors.textPrimary}]}>
              {preview.name ?? 'Bot'}
            </Text>
            {preview.username ? (
              <Text style={[styles.user, {color: colors.textSecondary}]}>
                @{preview.username}
              </Text>
            ) : null}
          </View>
        </View>
        <Text style={[styles.body, {color: colors.textSecondary}]}>
          {texts.confirmBody}
        </Text>
        {replaceRequired ? (
          <Pressable
            onPress={() => setReplaceOk(!replaceOk)}
            style={[styles.check, {backgroundColor: colors.bgSecondary}]}>
            <View
              style={[
                styles.box,
                {
                  borderColor: colors.accent,
                  backgroundColor: replaceOk
                    ? colors.accent
                    : colors.bgPrimary,
                },
              ]}>
              {replaceOk ? (
                <Text style={[styles.tick, {color: colors.white}]}>✓</Text>
              ) : null}
            </View>
            <AlertTriangle size={m.ghostIcon} color={colors.warn} />
            <Text style={[styles.checkText, {color: colors.textPrimary}]}>
              {texts.confirmReplace}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {err ? (
        <View style={[styles.err, {backgroundColor: colors.dangerSoft}]}>
          <Text style={[styles.errText, {color: colors.danger}]}>{err}</Text>
        </View>
      ) : null}
      <Pressable
        disabled={!canSubmit}
        onPress={onConfirm}
        style={[
          styles.btn,
          !canSubmit ? styles.btnDisabled : null,
          {
            backgroundColor: canSubmit ? colors.accent : colors.bgTertiary,
          },
        ]}>
        <Text
          style={[
            styles.btnText,
            {color: canSubmit ? colors.white : colors.textSecondary},
          ]}>
          {confirming ? texts.confirming : texts.confirmBtn}
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
    gap: m.bodyGap,
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
  name: {fontSize: m.botNameSize, fontWeight: m.weight600},
  user: {fontSize: m.botUserSize},
  body: {fontSize: m.cardTextSize, lineHeight: m.cardTextLine},
  check: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: m.readyRowGap,
    padding: m.checkPad,
    borderRadius: m.bannerRadius,
  },
  box: {
    width: m.checkBox,
    height: m.checkBox,
    borderRadius: m.checkBoxRadius,
    borderWidth: m.checkBoxBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tick: {fontSize: m.tickFont, fontWeight: m.weight700},
  checkText: {flex: 1, fontSize: m.checkFont, lineHeight: m.checkLine},
  err: {
    paddingVertical: m.bannerPadV,
    paddingHorizontal: m.bannerPadH,
    borderRadius: m.bannerRadius,
  },
  errText: {fontSize: m.cardTextSize},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnDisabled: {opacity: m.btnDisabledOpacity},
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
