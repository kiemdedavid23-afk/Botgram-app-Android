/**
 * Token — AssociateTokenPage.tsx. Jeton en mémoire uniquement.
 * Imports : ../components, ../store, ../texts, ../../../shared/theme, ../../../core/utils
 */
import React, {useState} from 'react';
import {View, Text, TextInput, Pressable, StyleSheet} from 'react-native';
import {KeyRound, Eye, EyeOff} from 'lucide-react-native';
import {useTheme, associateMetrics as m} from '../../../shared/theme';
import {AssociateShell} from '../components/AssociateShell';
import {useAssociateStore} from '../store/associateStore';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  onVerified: (result: string) => void;
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
  const [local, setLocal] = useState(token);

  const onChange = (t: string) => {
    setLocal(t);
    setToken(t);
  };

  const onVerify = () => {
    fireAndForget(
      (async () => {
        const r = await verify();
        onVerified(r);
      })(),
    );
  };

  const canVerify = local.trim().length > 0 && !verifying;

  return (
    <AssociateShell title={texts.tokenTitle} step={3} onBack={onBack}>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, shadowColor: colors.black},
        ]}>
        <View style={styles.row}>
          <KeyRound size={20} color={colors.accent} />
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
          value={local}
          onChangeText={onChange}
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
            <EyeOff size={16} color={colors.accent} />
          ) : (
            <Eye size={16} color={colors.accent} />
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
          canVerify ? styles.btnEnabled : styles.btnDisabled,
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
    elevation: 1,
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    gap: 8,
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 4},
  cardTitle: {fontSize: 16, fontWeight: m.weight600},
  help: {fontSize: 14, lineHeight: 20, marginBottom: 4},
  label: {fontSize: 14},
  input: {
    borderWidth: 1,
    borderRadius: m.inputRadius,
    paddingVertical: m.inputPadV,
    paddingHorizontal: m.inputPadH,
    fontSize: m.inputFont,
    marginTop: m.inputMarginTop,
  },
  ghost: {
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: m.btnRadius,
    paddingVertical: 12,
  },
  ghostText: {fontSize: 15, fontWeight: m.weight600},
  btn: {
    borderRadius: m.btnRadius,
    paddingVertical: m.btnPadV,
    paddingHorizontal: m.btnPadH,
    alignItems: 'center',
  },
  btnEnabled: {},
  btnDisabled: {opacity: m.btnDisabledOpacity},
  btnText: {fontSize: m.btnFont, fontWeight: m.btnWeight},
});
