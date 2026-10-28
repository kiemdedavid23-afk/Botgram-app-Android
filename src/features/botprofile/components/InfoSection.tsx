/**
 * Onglet Infos (lecture seule) — lignes « libellé · valeur » alignées,
 * rappel de modification via @BotFather, puis resynchronisation.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import type {BotStatus} from '../../../core/api/endpoints/bots';
import {STATUS_LABELS} from '../utils/labels';
import {texts} from '../texts';

type Props = {
  profile: BotProfile;
  status?: BotStatus;
  loading: boolean;
  onResync: () => void;
};

type Row = {key: string; label: string; value: string};

export function InfoSection({
  profile,
  status,
  loading,
  onResync,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const rows: Row[] = [
    {
      key: 'username',
      label: texts.infoUsername,
      value: profile.info.username ? `@${profile.info.username}` : '—',
    },
    {
      key: 'status',
      label: texts.infoStatus,
      value: status ? STATUS_LABELS[status] : '—',
    },
    {
      key: 'synced',
      label: texts.infoSynced,
      value: new Date(profile.synced_at).toLocaleString('fr-FR'),
    },
  ];

  return (
    <View style={styles.stack}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        {rows.map((r, i) => (
          <View
            key={r.key}
            style={[
              styles.row,
              i > 0 && {
                borderTopWidth: StyleSheet.hairlineWidth,
                borderTopColor: colors.border,
              },
            ]}>
            <Text style={[styles.k, {color: colors.textSecondary}]}>
              {r.label}
            </Text>
            <Text
              selectable
              style={[styles.v, {color: colors.textPrimary}]}
              numberOfLines={2}>
              {r.value}
            </Text>
          </View>
        ))}
      </View>
      <Text style={[styles.note, {color: colors.textHint}]}>
        {texts.readOnlyNote}
      </Text>
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
  card: {borderRadius: m.cardRadius, paddingHorizontal: m.infoCardPad},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: m.rowGap,
    paddingVertical: m.rowPaddingV,
  },
  k: {fontSize: m.labelSize},
  v: {
    flex: 1,
    textAlign: 'right',
    fontSize: m.infoValSize,
    fontWeight: m.infoValWeight,
  },
  note: {fontSize: m.noteSize, lineHeight: m.noteLineHeight},
  btn: {
    height: m.inputHeight,
    borderRadius: m.inputRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontWeight: m.infoBtnWeight, fontSize: m.infoBtnFontSize},
});
