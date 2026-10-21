/**
 * Confirm — AssociateConfirmPage.tsx.
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {AlertTriangle} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore} from '../store/associateStore';
import {texts, confirmError} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useBotsStore} from '../../bots/store/botsStore';
import {useQuotaStore} from '../../member/store/quotaStore';

type Props = {onDone: () => void; onBack: () => void};

export function AssociateConfirmScreen({
  onDone,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const preview = useAssociateStore(s => s.preview);
  const confirming = useAssociateStore(s => s.confirming);
  const confirm = useAssociateStore(s => s.confirm);
  const loadBots = useBotsStore(s => s.load);
  const loadQuota = useQuotaStore(s => s.load);
  const replaceRequired = !!preview?.replace_required;
  const [replaceOk, setReplaceOk] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const canSubmit =
    !confirming && (!replaceRequired || replaceOk) && !!preview;

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
        setErr(confirmError(res.reason));
      })(),
    );
  };

  const initial = (preview?.name || 'B').charAt(0).toUpperCase();

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
              {preview?.name ?? 'Bot'}
            </Text>
            {preview?.username ? (
              <Text style={{color: colors.textSecondary}}>
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
                  backgroundColor: replaceOk ? colors.accent : colors.bgPrimary,
                },
              ]}>
              {replaceOk ? (
                <Text style={{color: colors.white, fontSize: 12}}>✓</Text>
              ) : null}
            </View>
            <AlertTriangle size={16} color={colors.warn} />
            <Text style={[styles.checkText, {color: colors.textPrimary}]}>
              {texts.confirmReplace}
            </Text>
          </Pressable>
        ) : null}
      </View>
      {err ? (
        <View style={[styles.err, {backgroundColor: colors.danger + '14'}]}>
          <Text style={{color: colors.danger, fontSize: m.cardTextSize}}>
            {err}
          </Text>
        </View>
      ) : null}
      <Pressable
        disabled={!canSubmit}
        onPress={onConfirm}
        style={[
          styles.btn,
          {
            backgroundColor: canSubmit ? colors.accent : colors.bgTertiary,
            opacity: canSubmit ? 1 : 0.7,
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
    elevation: 1,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    gap: 16,
  },
  preview: {flexDirection: 'row', alignItems: 'center', gap: 14},
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
  body: {fontSize: m.cardTextSize, lineHeight: m.cardTextLine},
  check: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: m.checkPad,
    borderRadius: m.bannerRadius,
  },
  box: {
    width: m.checkBox,
    height: m.checkBox,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {flex: 1, fontSize: m.checkFont, lineHeight: 22},
  err: {
    paddingVertical: m.bannerPadV,
    paddingHorizontal: m.bannerPadH,
    borderRadius: m.bannerRadius,
  },
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
