import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t} from '../texts';
import type {FolderId} from '../store/filters';

type Props = {
  folder: FolderId;
  counts: Record<FolderId, number>;
  onSelect: (f: FolderId) => void;
};

const FOLDERS: Array<{id: FolderId; label: string}> = [
  {id: 'all', label: t.folderAll},
  {id: 'personal', label: t.folderPersonal},
  {id: 'work', label: t.folderWork},
  {id: 'unread', label: t.folderUnread},
];

export function FoldersBar({folder, counts, onSelect}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View
      style={{
        paddingTop: cm.foldersPaddingT,
        paddingHorizontal: cm.foldersPaddingH,
        paddingBottom: cm.foldersPaddingB,
      }}>
      <View
        style={[
          styles.track,
          {
            backgroundColor: colors.bgSecondary,
            borderRadius: cm.foldersTrackRadius,
            padding: cm.foldersTrackPad,
          },
        ]}>
        {FOLDERS.map(f => {
          const active = folder === f.id;
          return (
            <Pressable
              key={f.id}
              onPress={() => onSelect(f.id)}
              style={[
                styles.tab,
                active && {backgroundColor: colors.accentSoft},
              ]}>
              <Text
                style={{
                  color: active ? colors.accent : colors.textSecondary,
                  fontSize: cm.folderTabFont,
                  fontWeight: active
                    ? fontWeight.semibold
                    : fontWeight.medium,
                }}>
                {f.label}
              </Text>
              <View
                style={[
                  styles.count,
                  {
                    backgroundColor: active
                      ? colors.accent
                      : colors.bgTertiary,
                  },
                ]}>
                <Text
                  style={{
                    color: active ? colors.white : colors.textSecondary,
                    fontSize: cm.folderCountSize,
                    fontWeight: fontWeight.semibold,
                  }}>
                  {counts[f.id]}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {flexDirection: 'row', flexWrap: 'wrap'},
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
