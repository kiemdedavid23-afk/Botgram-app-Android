/**
 * Album entrant — mosaïque type Telegram : photos/vidéos collées au bord de la
 * bulle, rangées de 1 à 3 éléments (ex. 7 éléments = 2 + 2 + 3).
 * Les documents d'un album s'affichent en liste sous la mosaïque.
 */
import React from 'react';
import {View, StyleSheet, useWindowDimensions} from 'react-native';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {MediaPhoto} from './MediaPhoto';
import {MediaFile} from './MediaFile';
import {MediaVideo} from './MediaVideo';
import {FormattedText} from './FormattedText';
import {useTheme} from '../../../shared/theme';
import type {AlbumItem} from '../../../core/realtime/events';

type Props = {
  items: AlbumItem[];
  caption?: string | null;
  parseMode?: string | null;
  isOut?: boolean;
};

/** Nombre d'éléments par rangée selon le total. */
function rowsFor(n: number): number[] {
  const table: Record<number, number[]> = {
    1: [1],
    2: [2],
    3: [1, 2],
    4: [2, 2],
    5: [2, 3],
    6: [3, 3],
    7: [2, 2, 3],
    8: [2, 3, 3],
    9: [3, 3, 3],
    10: [2, 2, 3, 3],
  };
  const known = table[n];
  if (known) return known;
  const full = Math.floor(n / 3);
  const rem = n % 3;
  if (rem === 0) return new Array<number>(full).fill(3);
  if (rem === 2) return [2, ...new Array<number>(full).fill(3)];
  return [2, 2, ...new Array<number>(Math.max(full - 1, 0)).fill(3)];
}

function isPhotoItem(item: AlbumItem): boolean {
  return (
    item.kind === 'photo' || (item.attachment?.mime ?? '').startsWith('image/')
  );
}

function isVideoItem(item: AlbumItem): boolean {
  return (
    item.kind === 'video' || (item.attachment?.mime ?? '').startsWith('video/')
  );
}

export function MediaAlbum({
  items,
  caption,
  parseMode,
  isOut,
}: Props): React.JSX.Element {
  const {colors, appearance} = useTheme();
  const {width: winW} = useWindowDimensions();
  const W = Math.min(
    Math.round(winW * tm.bubbleMaxWidthPct) - 2 * tm.mediaBubblePad,
    tm.mediaMaxWidth,
  );
  const gap = tm.mediaAlbumGap;
  const corner = Math.max(appearance.cornerRadius - tm.mediaBubblePad, 6);
  const sidePad = tm.bubblePadH - tm.mediaBubblePad;

  const visual = items.filter(i => isPhotoItem(i) || isVideoItem(i));
  const others = items.filter(i => !(isPhotoItem(i) || isVideoItem(i)));

  const rows: AlbumItem[][] = [];
  let cursor = 0;
  for (const k of rowsFor(visual.length)) {
    rows.push(visual.slice(cursor, cursor + k));
    cursor += k;
  }

  return (
    <View style={{width: W}}>
      {rows.length > 0 ? (
        <View style={[styles.grid, {gap, borderRadius: corner}]}>
          {rows.map((row, ri) => {
            const k = row.length;
            const baseW = Math.floor((W - gap * (k - 1)) / k);
            const rowH = k === 1 ? Math.round(W * 0.75) : Math.round(baseW * 1.1);
            return (
              <View key={`row-${ri}`} style={[styles.row, {gap}]}>
                {row.map((item, ci) => {
                  const cellW = ci === k - 1 ? W - (baseW + gap) * (k - 1) : baseW;
                  return (
                    <View
                      key={item.id}
                      style={{width: cellW, height: rowH, overflow: 'hidden'}}>
                      {isVideoItem(item) ? (
                        <MediaVideo
                          messageId={item.id}
                          kind="video"
                          size={item.attachment?.size}
                          forceWidth={cellW}
                          forceHeight={rowH}
                        />
                      ) : (
                        <MediaPhoto
                          messageId={item.id}
                          size={item.attachment?.size}
                          fixedWidth={cellW}
                          fixedHeight={rowH}
                          radius={0}
                        />
                      )}
                    </View>
                  );
                })}
              </View>
            );
          })}
        </View>
      ) : null}
      {others.map(item => (
        <View
          key={item.id}
          style={{paddingHorizontal: sidePad, paddingVertical: 4}}>
          <MediaFile
            messageId={item.id}
            name={item.attachment?.name}
            size={item.attachment?.size}
            mime={item.attachment?.mime}
            isOut={isOut}
            width={W - 2 * sidePad}
          />
        </View>
      ))}
      {caption ? (
        <View style={{paddingHorizontal: sidePad, paddingTop: 4}}>
          <FormattedText
            text={caption}
            parseMode={parseMode}
            color={colors.textPrimary}
            fontSize={appearance.fontSize}
          />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {overflow: 'hidden'},
  row: {flexDirection: 'row'},
});
