/** Ligne épinglée « Botfactor » en haut de la liste Échanges. */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import {useBotfactorLauncher} from '../store/launcherStore';
import {texts as T} from '../texts';

export function BotfactorRow(): React.JSX.Element {
  const {colors} = useTheme();
  const openWith = useBotfactorLauncher(s => s.openWith);
  return (
    <Pressable
      onPress={() => openWith()}
      style={[styles.row, {backgroundColor: colors.bgPrimary}]}>
      <Avatar size={bm.rowAvatar} title={T.title} initials="BF" />
      <View style={styles.body}>
        <Text style={[styles.name, {color: colors.textPrimary}]}>{T.title}</Text>
        <Text style={{color: colors.textSecondary}} numberOfLines={1}>
          {T.rowPreview}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bm.rowGap,
    paddingHorizontal: bm.rowPadH,
    paddingVertical: bm.rowPadV,
  },
  body: {flex: 1},
  name: {fontSize: 16, fontWeight: '600'},
});
