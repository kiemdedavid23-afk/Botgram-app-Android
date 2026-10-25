/**
 * Album entrant — tous les éléments en grille (2 colonnes).
 */
import React from 'react';
import {View, StyleSheet} from 'react-native';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {MediaPhoto} from './MediaPhoto';
import {MediaFile} from './MediaFile';
import {FormattedText} from './FormattedText';
import {useTheme} from '../../../shared/theme';
import type {AlbumItem} from '../../../core/realtime/events';

type Props = {
  items: AlbumItem[];
  caption?: string | null;
  parseMode?: string | null;
};

export function MediaAlbum({
  items,
  caption,
  parseMode,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={styles.grid}>
        {items.map(item => {
          const isPhoto =
            item.kind === 'photo' ||
            (item.attachment?.mime ?? '').startsWith('image/');
          return (
            <View key={item.id} style={styles.cell}>
              {isPhoto ? (
                <MediaPhoto
                  messageId={item.id}
                  size={item.attachment?.size}
                />
              ) : (
                <MediaFile
                  messageId={item.id}
                  name={item.attachment?.name}
                  size={item.attachment?.size}
                  mime={item.attachment?.mime}
                />
              )}
            </View>
          );
        })}
      </View>
      {caption ? (
        <FormattedText
          text={caption}
          parseMode={parseMode}
          color={colors.textPrimary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: tm.mediaAlbumGap},
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: tm.mediaAlbumGap,
  },
  cell: {
    width: `${100 / tm.mediaAlbumColumns}%` as unknown as number,
    flexGrow: 1,
    minWidth: tm.mediaAlbumCellMin,
  },
});
