/**
 * Médias / Documents / Liens d'une conversation, lus sur le téléphone.
 * Les messages ne sont pas affichés ici : ils restent dans la discussion.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ActivityIndicator,
  Alert,
  Linking,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import {
  ArrowDown,
  File,
  Link2,
  Play,
  AlertCircle,
} from 'lucide-react-native';
import {
  useTheme,
  radii,
  fontSize,
  fontWeight,
  getShadow,
} from '../../../shared/theme';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {openImageViewer} from '../../../core/media/imageViewer';
import {openMediaFile} from '../../../core/storage/mediaFiles';
import {getVideoInfo} from '../../../core/media/native/nativeMedia';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {contactsTexts as t} from '../texts';
import {useSharedContent} from '../hooks/useSharedContent';
import {useLocalMedia} from '../hooks/useLocalMedia';
import {
  extensionOf,
  formatBytes,
  formatShortDate,
  type DocEntry,
  type LinkEntry,
  type MediaEntry,
} from '../utils/sharedMedia';

type TabId = 'media' | 'docs' | 'links';

const GAP = 2;
const COLUMNS = 3;

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

async function openEntry(entry: MediaEntry, photos: MediaEntry[]): Promise<void> {
  if (entry.type === 'photo') {
    const storage = getMediaStorage();
    const present = await Promise.all(
      photos.map(p => storage.exists(p.id).catch(() => false)),
    );
    const items = photos
      .filter((_, i) => present[i])
      .map(p => ({uri: `file://${storage.localPath(p.id)}`}));
    const index = Math.max(
      0,
      photos.filter((_, i) => present[i]).findIndex(p => p.id === entry.id),
    );
    if (openImageViewer(items, index)) return;
  }
  const res = await openMediaFile(
    entry.id,
    entry.mime ?? (entry.type === 'photo' ? 'image/jpeg' : 'video/mp4'),
  );
  if (!res.ok) Alert.alert(t.noHandler);
}

function MediaTile({
  entry,
  size,
  photos,
}: {
  entry: MediaEntry;
  size: number;
  photos: MediaEntry[];
}): React.JSX.Element {
  const {colors} = useTheme();
  const {local, loading, error, ensure, path} = useLocalMedia(entry.id, {
    kind: entry.type,
  });
  const [video, setVideo] = useState<{thumb: string; ms: number} | null>(null);

  useEffect(() => {
    if (entry.type !== 'video' || !local) return;
    let alive = true;
    fireAndForget(
      getVideoInfo(path, entry.id).then(info => {
        if (alive && info) setVideo({thumb: info.thumbUri, ms: info.durationMs});
      }),
    );
    return () => {
      alive = false;
    };
  }, [entry.type, entry.id, local, path]);

  const onPress = useCallback(() => {
    fireAndForget(
      (async () => {
        if (local || (await ensure())) await openEntry(entry, photos);
      })(),
    );
  }, [local, ensure, entry, photos]);

  const box = {width: size, height: size, backgroundColor: colors.bgTertiary};
  const thumbUri =
    entry.type === 'photo' && local ? `file://${path}` : video?.thumb;

  return (
    <Pressable onPress={onPress} style={[styles.tile, box]}>
      {thumbUri ? (
        <Image
          source={{uri: thumbUri}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          resizeMethod="resize"
        />
      ) : null}

      {entry.type === 'video' && local ? (
        <>
          <View style={styles.playWrap}>
            <View style={styles.playDot}>
              <Play size={18} color="#fff" fill="#fff" />
            </View>
          </View>
          {video ? (
            <View style={styles.badge}>
              <Play size={10} color="#fff" fill="#fff" />
              <Text style={styles.badgeText}>{formatDuration(video.ms)}</Text>
            </View>
          ) : null}
        </>
      ) : null}

      {local === false && !loading && !error ? (
        <View style={styles.center}>
          <ArrowDown size={22} color={colors.textSecondary} />
          {entry.size ? (
            <Text style={[styles.tileSub, {color: colors.textHint}]}>
              {formatBytes(entry.size)}
            </Text>
          ) : null}
        </View>
      ) : null}
      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : null}
      {error && !loading ? (
        <View style={styles.center}>
          <AlertCircle size={20} color={colors.danger} />
          <Text
            numberOfLines={2}
            style={[styles.tileSub, {color: colors.danger}]}>
            {error}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

function MediaGrid({media}: {media: MediaEntry[]}): React.JSX.Element {
  const [width, setWidth] = useState(0);
  const photos = React.useMemo(
    () => media.filter(e => e.type === 'photo'),
    [media],
  );
  const size = width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;
  return (
    <View
      style={styles.grid}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {size > 0
        ? media.map(entry => (
            <MediaTile key={entry.id} entry={entry} size={size} photos={photos} />
          ))
        : null}
    </View>
  );
}

function DocRow({entry}: {entry: DocEntry}): React.JSX.Element {
  const {colors} = useTheme();
  const {local, loading, error, ensure} = useLocalMedia(entry.id, {
    kind: 'document',
    name: entry.name,
  });
  const [openError, setOpenError] = useState<string | null>(null);

  const onPress = () => {
    setOpenError(null);
    fireAndForget(
      (async () => {
        if (!(local || (await ensure()))) return;
        const res = await openMediaFile(entry.id, entry.mime);
        if (!res.ok) {
          setOpenError(res.code === 'no_handler' ? t.noHandler : t.loadError);
        }
      })(),
    );
  };

  const sub = [formatBytes(entry.size), extensionOf(entry.name), formatShortDate(entry.at)]
    .filter(Boolean)
    .join(' · ');

  return (
    <Pressable
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed && {backgroundColor: colors.bgSecondary}]}>
      <View style={[styles.circle, {backgroundColor: colors.accent}]}>
        {loading ? (
          <ActivityIndicator color={colors.white} />
        ) : local ? (
          <File size={20} color={colors.white} />
        ) : (
          <ArrowDown size={20} color={colors.white} />
        )}
      </View>
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.rowTitle, {color: colors.textPrimary}]}>
          {entry.name}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSub, {color: colors.textSecondary}]}>
          {sub}
        </Text>
        {error || openError ? (
          <Text style={[styles.rowSub, {color: colors.danger}]}>
            {openError ?? error}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

function LinkRow({entry}: {entry: LinkEntry}): React.JSX.Element {
  const {colors} = useTheme();
  const onPress = () => {
    fireAndForget(Linking.openURL(entry.url).catch(() => undefined));
  };
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="link"
      style={({pressed}) => [styles.row, pressed && {backgroundColor: colors.bgSecondary}]}>
      <View style={[styles.circle, {backgroundColor: colors.accentSoft}]}>
        <Link2 size={20} color={colors.accent} />
      </View>
      <View style={styles.rowText}>
        <Text numberOfLines={1} style={[styles.rowTitle, {color: colors.textPrimary}]}>
          {entry.host}
        </Text>
        <Text numberOfLines={1} style={[styles.rowSub, {color: colors.accent}]}>
          {entry.url}
        </Text>
        <Text style={[styles.rowSub, {color: colors.textSecondary}]}>
          {formatShortDate(entry.at)}
        </Text>
      </View>
    </Pressable>
  );
}

export function ContactSharedTabs({
  conversationId,
}: {
  conversationId: string;
}): React.JSX.Element {
  const {colors, mode} = useTheme();
  const {content, ready} = useSharedContent(conversationId);
  const [tab, setTab] = useState<TabId>('media');

  const tabs: ReadonlyArray<{id: TabId; label: string}> = [
    {id: 'media', label: t.tabMedia},
    {id: 'docs', label: t.tabDocs},
    {id: 'links', label: t.tabLinks},
  ];

  const emptyText =
    tab === 'media' ? t.emptyMedia : tab === 'docs' ? t.emptyDocs : t.emptyLinks;
  const isEmpty =
    tab === 'media'
      ? content.media.length === 0
      : tab === 'docs'
        ? content.docs.length === 0
        : content.links.length === 0;

  const listCard = [
    styles.listCard,
    {backgroundColor: colors.bgPrimary},
    getShadow('sm', mode),
  ];

  return (
    <View style={styles.wrap}>
      <View style={[styles.tabs, {backgroundColor: colors.bgPrimary}, getShadow('sm', mode)]}>
        {tabs.map(x => {
          const active = x.id === tab;
          return (
            <Pressable
              key={x.id}
              accessibilityRole="tab"
              accessibilityState={{selected: active}}
              onPress={() => setTab(x.id)}
              style={[
                styles.tab,
                active && {backgroundColor: colors.accentSoft},
              ]}>
              <Text
                style={[
                  styles.tabText,
                  {color: active ? colors.accent : colors.textSecondary},
                ]}>
                {x.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {!ready ? (
        <ActivityIndicator color={colors.accent} style={styles.loader} />
      ) : isEmpty ? (
        <Text style={[styles.empty, {color: colors.textSecondary}]}>
          {emptyText}
        </Text>
      ) : tab === 'media' ? (
        <MediaGrid media={content.media} />
      ) : tab === 'docs' ? (
        <View style={listCard}>
          {content.docs.map(d => (
            <DocRow key={d.id} entry={d} />
          ))}
        </View>
      ) : (
        <View style={listCard}>
          {content.links.map(l => (
            <LinkRow key={l.id} entry={l} />
          ))}
        </View>
      )}

      {ready ? (
        <Text style={[styles.note, {color: colors.textHint}]}>
          {t.sharedNote}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {gap: 12},
  tabs: {
    flexDirection: 'row',
    alignSelf: 'center',
    padding: 5,
    borderRadius: radii.full,
    gap: 4,
  },
  tab: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: radii.full,
  },
  tabText: {fontSize: fontSize.message, fontWeight: fontWeight.semibold},
  loader: {paddingVertical: 32},
  empty: {textAlign: 'center', paddingVertical: 32, fontSize: fontSize.message},
  note: {fontSize: 12, textAlign: 'center', paddingHorizontal: 16},
  grid: {flexDirection: 'row', flexWrap: 'wrap', gap: GAP},
  tile: {overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  center: {alignItems: 'center', justifyContent: 'center', gap: 4, padding: 4},
  tileSub: {fontSize: 10, textAlign: 'center'},
  playWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playDot: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    left: 6,
    bottom: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  badgeText: {color: '#fff', fontSize: 12, fontWeight: fontWeight.semibold},
  listCard: {borderRadius: radii.lg, overflow: 'hidden'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  circle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowText: {flex: 1, minWidth: 0, gap: 2},
  rowTitle: {fontSize: fontSize.message, fontWeight: fontWeight.semibold},
  rowSub: {fontSize: 13},
});
