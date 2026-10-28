/** Pastille d'état de connexion du bot (ex. « Connecté »). */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import type {BotStatus} from '../../../core/api/endpoints/bots';
import {STATUS_LABELS} from '../utils/labels';

type Props = {status: BotStatus | undefined};

export function HeroStatus({status}: Props): React.JSX.Element | null {
  const {colors} = useTheme();
  if (!status) return null;
  let dot = colors.heroTextMuted;
  if (status === 'connected') dot = colors.online;
  else if (status === 'pending') dot = colors.warn;
  else if (status === 'webhook_error' || status === 'token_invalid') {
    dot = colors.danger;
  }
  return (
    <View
      style={[
        styles.pill,
        {backgroundColor: colors.heroChipBg, borderColor: colors.heroChipBorder},
      ]}>
      <View style={[styles.dot, {backgroundColor: dot}]} />
      <Text style={[styles.text, {color: colors.heroText}]}>
        {STATUS_LABELS[status]}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: h.statusGap,
    paddingVertical: h.statusPadV,
    paddingHorizontal: h.statusPadH,
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
  },
  dot: {width: h.statusDot, height: h.statusDot, borderRadius: h.statusDot / 2},
  text: {fontSize: h.statusFont, fontWeight: '600'},
});
