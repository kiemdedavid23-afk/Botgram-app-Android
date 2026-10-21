/**
 * Token — AssociateTokenPage.tsx. Jeton en mémoire uniquement (store).
 */
import React from 'react';
import {View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import {KeyRound, Eye, EyeOff} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {
  useAssociateStore,
  type VerifyResult,
} from '../store/associateStore';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  onVerified: (result: VerifyResult) => void;
  onBack: () => void;
};

export function AssociateTokenScreen({
  onVerified,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const token = useAssociateStore(s => s.token) ?? '';
  const revealed = useAssociateStore(s => s.revealed);
  const verifying = useAssociateStore(s => s.verifying);
  const setToken = useAssociateStore(s => s.setToken);
  const setRevealed = useAssociateStore(s => s.setRevealed);
  const verify = useAssociateStore(s => s.verify);

  const onVerify = () => {
    fireAndForget(
      (async () => {
        const r = await verify();
        onVerified(r);
      })(),
    );
  };

  const canVerify = token.trim().length > 0 && !verifying;

  return (
    <AssociateShell title={texts.tokenTitle} step={3} onBack={onBack}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <View style={styles.row}>
          <KeyRound size={m.tokenIcon} color={colors.accent} />
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
            {texts.tokenCardTitle}
          </Text>
        </View>
        <Text style={[styles.help, {color: colors.textSecondary}]}>
          {texts.tokenHelp}
        </Text>
        <Text style={[styles.label, {color: colors.textSecondary}]}>
          {texts.tokenLabel}
        </Text>
        <TextInput
          style={[
            styles.input,
            {
              borderColor: colors.border,
              backgroundColor: colors.bgPrimary,
              color: colors.textPrimary,
            },
          ]}
          value={token}
          onChangeText={setToken}
          placeholder={texts.tokenPlaceholder}
          placeholderTextColor={colors.textHint}
          secureTextEntry={!revealed}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="off"
          textContentType="none"
          importantForAutofill="no"
        />
        <Pressable
          onPress={() => setRevealed(!revealed)}
          style={[styles.ghost, {borderColor: colors.border}]}>
          {revealed ? (
            <EyeOff size={m.ghostIcon} color={colors.accent} />
          ) : (
            <Eye size={m.ghostIcon} color={colors.accent} />
          )}
          <Text style={[styles.ghostText, {color: colors.accent}]}>
            {revealed ? texts.hideToken : texts.showToken}
          </Text>
        </Pressable>
      </View>
      <Pressable
        disabled={!canVerify}
        onPress={onVerify}
        style={[
          styles.btn,
          !canVerify ? styles.btnDisabled : null,
          {
            backgroundColor: canVerify ? colors.accent : colors.bgTertiary,
          },
        ]}>
        <Text
          style={[
            styles.btnText,
            {color: canVerify ? colors.white : colors.textSecondary},
          ]}>
          {verifying ? texts.verifying : texts.verify}
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
    gap: m.ghostGap,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.tokenTitleRowGap,
    marginBottom: 4,
  },
  cardTitle: {fontSize: m.tokenTitleSize, fontWeight: m.weight600},
  help: {
    fontSize: m.tokenHelpSize,
    lineHeight: m.tokenHelpLine,
    marginBottom: 4,
  },
  label: {fontSize: m.tokenLabelSize},
  input: {
    borderWidth: 1,
    borderRadius: m.inputRadius,
    paddingVertical: m.inputPadV,
    paddingHorizontal: m.inputPadH,
    fontSize: m.inputFont,
    marginTop: m.inputMarginTop,
  },
  ghost: {
    marginTop: m.ghostGap,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: m.ghostGap,
    borderWidth: 1,
    borderRadius: m.btnRadius,
    paddingVertical: m.ghostPadV,
  },
  ghostText: {fontSize: m.ghostFont, fontWeight: m.weight600},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnDisabled: {opacity: m.btnDisabledOpacity},
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
