/**
 * Onglet Infos (lecture seule) — état + actualisation depuis Telegram.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';

type Props = {
  profile: BotProfile;
  loading: boolean;
  onResync: () => void;
};

export function InfoSection({
  profile,
  loading,
  onResync,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const when = new Date(profile.synced_at).toLocaleString('fr-FR');

  return (
    <View style={styles.stack}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <Text style={[styles.k, {color: colors.textSecondary}]}>
          {texts.infoStatus}
        </Text>
        <Text style={[styles.v, {color: colors.textPrimary}]}>
          @{profile.info.username || '—'}
        </Text>
        <Text style={[styles.k, {color: colors.textSecondary}]}>
          {texts.infoSynced}
        </Text>
        <Text style={[styles.v, {color: colors.textPrimary}]}>{when}</Text>
      </View>
      <Pressable
        onPress={onResync}
        disabled={loading}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : (
          <Text style={[styles.btnText, {color: colors.white}]}>
            {texts.infoResync}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: m.infoStackGap},
  card: {borderRadius: m.inputRadius, padding: m.infoCardPad, gap: m.infoCardGap},
  k: {fontSize: m.infoKeySize, marginTop: m.infoKeyMarginTop},
  v: {fontSize: m.infoValSize, fontWeight: m.infoValWeight},
  btn: {
    height: m.inputHeight,
    borderRadius: m.inputRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontWeight: m.infoBtnWeight, fontSize: m.infoBtnFontSize},
});