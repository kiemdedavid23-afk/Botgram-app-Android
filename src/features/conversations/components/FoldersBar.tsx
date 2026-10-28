import React from 'react';
import {View, ScrollView, StyleSheet} from 'react-native';
import {useTheme, getShadow} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t} from '../texts';
import type {FolderId} from '../store/filters';
import {FolderTab} from './FolderTab';

type Props = {
  folder: FolderId;
  counts: Record<FolderId, number>;
  onSelect: (f: FolderId) => void;
};

/**
 * Dossiers de la liste. « Archive » n'est plus un onglet : on y accède par la ligne
 * « Échanges archivés » (ArchiveRow), comme sur Telegram.
 */
const FOLDERS: Array<{id: FolderId; label: string}> = [
  {id: 'all', label: t.folderAll},
  {id: 'personal', label: t.folderPersonal},
  {id: 'work', label: t.folderWork},
  {id: 'unread', label: t.folderUnread},
];

export function FoldersBar({folder, counts, onSelect}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <View
      style={{
        paddingTop: cm.foldersPaddingT,
        paddingHorizontal: cm.foldersPaddingH,
        paddingBottom: cm.foldersPaddingB,
      }}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.border,
            borderRadius: cm.foldersPillRadius,
            borderWidth: cm.foldersPillBorder,
            padding: cm.foldersPillPad,
            ...getShadow('navPill', mode),
          },
        ]}>
        {/* Une seule ligne ; défile horizontalement si l'écran est étroit. */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabs}>
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
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {overflow: 'hidden'},
  tabs: {flexDirection: 'row', alignItems: 'center'},
});
