import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import type {FolderId} from '../store/filters';

type Props = {
  id: FolderId;
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
};

export function FolderTab({label, count, active, onPress}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const labelColor = active ? colors.accent : colors.textSecondary;
  const countBg = active ? colors.accent : colors.bgTertiary;
  const countColor = active ? colors.white : colors.textSecondary;
  const weight = active ? fontWeight.semibold : fontWeight.medium;
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && {backgroundColor: colors.accentSoft}]}>
      <Text style={{color: labelColor, fontSize: cm.folderTabFont, fontWeight: weight}}>
        {label}
      </Text>
      <View style={[styles.count, {backgroundColor: countBg}]}>
        <Text
          style={{
            color: countColor,
            fontSize: cm.folderCountSize,
            fontWeight: fontWeight.semibold,
          }}>
          {count}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.folderTabGap,
    paddingVertical: cm.folderTabPadV,
    paddingHorizontal: cm.folderTabPadH,
    borderRadius: cm.folderTabRadius,
  },
  count: {
    minWidth: cm.folderCountMin,
    height: cm.folderCountMin,
    paddingHorizontal: cm.folderCountPadH,
    borderRadius: cm.folderCountMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
