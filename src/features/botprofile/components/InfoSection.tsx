/**
 * Onglet Infos — état + resync avec garde brouillon.
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {hasChanges} from '../utils/diff';
import {texts} from '../texts';
import {ConfirmDialog} from '../../gestion/components/ConfirmDialog';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  profile: BotProfile;
  saved: BotProfile | null;
  draft: BotProfile | null;
  onResync: () => void;
};

export function InfoSection({
  profile,
  saved,
  draft,
  onResync,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [confirm, setConfirm] = useState(false);
  const dirty = hasChanges(saved, draft);
  const when = new Date(profile.synced_at).toLocaleString('fr-FR');

  const askResync = () => {
    if (dirty) setConfirm(true);
    else onResync();
  };

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
        onPress={askResync}
        style={[styles.btn, {backgroundColor: colors.accent}]}>
        <Text style={[styles.btnText, {color: colors.white}]}>
          {texts.infoResync}
        </Text>
      </Pressable>
      <ConfirmDialog
        visible={confirm}
        title={texts.resyncConfirmTitle}
        body={texts.resyncConfirmBody}
        onCancel={() => setConfirm(false)}
        onConfirm={() => {
          setConfirm(false);
          onResync();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  stack: {gap: 12},
  card: {borderRadius: m.inputRadius, padding: 14, gap: 4},
  k: {fontSize: 12, marginTop: 6},
  v: {fontSize: 15, fontWeight: '600'},
  btn: {
    height: m.inputHeight,
    borderRadius: m.inputRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {fontWeight: '700', fontSize: 15},
});
