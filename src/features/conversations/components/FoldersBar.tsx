import React from 'react';
import {View, StyleSheet} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t} from '../texts';
import type {FolderId} from '../store/filters';
import {FolderTab} from './FolderTab';

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
  {id: 'archive', label: t.folderArchive},
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
        {FOLDERS.map(f => (
          <FolderTab
            key={f.id}
            id={f.id}
            label={f.label}
            count={counts[f.id]}
            active={folder === f.id}
            onPress={() => onSelect(f.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {flexDirection: 'row', flexWrap: 'wrap'},
});
