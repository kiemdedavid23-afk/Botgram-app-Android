/**
 * Onglet Galerie : case caméra (aperçu en direct) + grille de 3 colonnes des photos et vidéos
 * du téléphone, avec cercles de sélection numérotés. Sans permission : carte d'explication
 * et sélecteur Android de repli.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  FlatList,
  ActivityIndicator,
  Linking,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import {Camera, Play} from 'lucide-react-native';
import {useTheme, radii, fontSize, fontWeight} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {MEDIA_MAX_FILE_BYTES} from '../mediaLimits';
import {attachTexts as t} from './texts';
import {useGallery} from './useGallery';
import {CameraPreview} from './CameraPreview';
import {CameraCapture} from './CameraCapture';
import type {CameraPhoto, GalleryAsset} from './nativeAttach';
import {
  checkCameraAccess,
  requestCameraAccess,
  type CameraAccess,
} from './permissions';

const GAP = 2;
const COLUMNS = 3;

type Props = {
  active: boolean;
  /** Clés des éléments choisis, dans l'ordre de sélection. */
  selectedKeys: ReadonlyArray<string>;
  onToggle: (asset: GalleryAsset) => void;
  onCameraPhoto: (photo: CameraPhoto) => void;
  onFallbackPick: () => void;
  /** Espace réservé en bas pour la barre flottante. */
  bottomSpace: number;
};

type Cell = {kind: 'camera'} | {kind: 'asset'; asset: GalleryAsset};

function formatDuration(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${(total % 60).toString().padStart(2, '0')}`;
}

export function GalleryTab({
  active,
  selectedKeys,
  onToggle,
  onCameraPhoto,
  onFallbackPick,
  bottomSpace,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const gallery = useGallery(active);
  const [width, setWidth] = useState(0);
  const [camAccess, setCamAccess] = useState<CameraAccess>('unknown');
  const [cameraOpen, setCameraOpen] = useState(false);

  useEffect(() => {
    if (active) fireAndForget(checkCameraAccess().then(setCamAccess));
  }, [active]);

  const onCameraPress = useCallback(() => {
    fireAndForget(
      (async () => {
        let access = camAccess;
        if (access !== 'granted') {
          access = await requestCameraAccess();
          setCamAccess(access);
        }
        if (access === 'granted') setCameraOpen(true);
        else if (access === 'blocked') await Linking.openSettings();
      })(),
    );
  }, [camAccess]);

  const size =
    width > 0 ? Math.floor((width - GAP * (COLUMNS - 1)) / COLUMNS) : 0;

  const cells: Cell[] = React.useMemo(
    () => [
      {kind: 'camera'},
      ...gallery.assets.map(asset => ({kind: 'asset', asset}) as Cell),
    ],
    [gallery.assets],
  );

  const denied = gallery.access === 'denied' || gallery.access === 'blocked';

  const renderCell = ({item}: {item: Cell}) => {
    const box = {width: size, height: size};
    if (item.kind === 'camera') {
      return (
        <Pressable
          onPress={onCameraPress}
          accessibilityRole="button"
          accessibilityLabel={t.cameraShutter}
          style={[styles.tile, box, {backgroundColor: colors.black}]}>
          <CameraPreview
            style={StyleSheet.absoluteFill}
            active={active && !cameraOpen && camAccess === 'granted'}
          />
          <View style={styles.camIcon}>
            <Camera size={26} color="#fff" />
          </View>
        </Pressable>
      );
    }
    const a = item.asset;
    const key = `g:${a.id}`;
    const order = selectedKeys.indexOf(key);
    const picked = order >= 0;
    const tooLarge = a.size > MEDIA_MAX_FILE_BYTES;
    return (
      <Pressable
        onPress={() => onToggle(a)}
        style={[styles.tile, box, {backgroundColor: colors.bgTertiary}]}>
        <Image
          source={{uri: a.uri}}
          style={StyleSheet.absoluteFill}
          resizeMode="cover"
          resizeMethod="resize"
        />
        {a.type === 'video' ? (
          <View style={styles.badge}>
            <Play size={10} color="#fff" fill="#fff" />
            <Text style={styles.badgeText}>{formatDuration(a.durationMs)}</Text>
          </View>
        ) : null}
        {tooLarge ? (
          <View style={styles.tooLarge}>
            <Text style={styles.tooLargeText}>{t.tooLarge}</Text>
          </View>
        ) : (
          <View
            style={[
              styles.circle,
              picked
                ? {backgroundColor: colors.accent, borderColor: colors.accent}
                : {borderColor: '#fff'},
            ]}>
            {picked ? <Text style={styles.circleText}>{order + 1}</Text> : null}
          </View>
        )}
        {picked ? <View style={[styles.pickedFrame, {borderColor: colors.accent}]} /> : null}
      </Pressable>
    );
  };

  if (gallery.access === 'unknown') {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (denied) {
    return (
      <View style={styles.center}>
        <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
          <Text style={[styles.cardTitle, {color: colors.textPrimary}]}>
            {t.accessTitle}
          </Text>
          <Text style={[styles.cardBody, {color: colors.textSecondary}]}>
            {t.accessBody}
          </Text>
          <Pressable
            onPress={
              gallery.access === 'blocked' ? gallery.openSettings : gallery.request
            }
            style={[styles.primaryBtn, {backgroundColor: colors.accent}]}>
            <Text style={[styles.primaryText, {color: colors.white}]}>
              {gallery.access === 'blocked'
                ? t.accessOpenSettings
                : t.accessAllow}
            </Text>
          </Pressable>
          <Pressable onPress={onFallbackPick} style={styles.linkBtn}>
            <Text style={[styles.linkText, {color: colors.accent}]}>
              {t.accessFallback}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <View
      style={styles.flex}
      onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}>
      {gallery.access === 'limited' ? (
        <View style={[styles.limited, {backgroundColor: colors.accentSoft}]}>
          <Text style={[styles.limitedText, {color: colors.textPrimary}]}>
            {t.limitedBody}
          </Text>
          <Pressable onPress={gallery.manageLimited} hitSlop={8}>
            <Text style={[styles.limitedLink, {color: colors.accent}]}>
              {t.limitedManage}
            </Text>
          </Pressable>
        </View>
      ) : null}
      {size > 0 ? (
        <FlatList
          data={cells}
          keyExtractor={c => (c.kind === 'camera' ? 'camera' : c.asset.id)}
          renderItem={renderCell}
          numColumns={COLUMNS}
          columnWrapperStyle={styles.row}
          contentContainerStyle={{paddingBottom: bottomSpace}}
          ItemSeparatorComponent={Gap}
          onEndReached={gallery.loadMore}
          onEndReachedThreshold={0.6}
          extraData={selectedKeys}
          initialNumToRender={18}
          windowSize={7}
          removeClippedSubviews
          ListFooterComponent={
            gallery.loading ? (
              <ActivityIndicator color={colors.accent} style={styles.loader} />
            ) : undefined
          }
          ListEmptyComponent={
            !gallery.loading ? (
              <Text style={[styles.empty, {color: colors.textSecondary}]}>
                {t.galleryEmpty}
              </Text>
            ) : undefined
          }
        />
      ) : null}
      <CameraCapture
        visible={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onCaptured={photo => {
          setCameraOpen(false);
          onCameraPhoto(photo);
        }}
      />
    </View>
  );
}

function Gap(): React.JSX.Element {
  return <View style={{height: GAP}} />;
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  row: {gap: GAP},
  center: {flex: 1, justifyContent: 'center', padding: 16},
  tile: {overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  camIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
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
  circle: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.15)',
  },
  circleText: {color: '#fff', fontSize: 13, fontWeight: fontWeight.bold},
  pickedFrame: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
  },
  tooLarge: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  tooLargeText: {color: '#fff', fontSize: 11, textAlign: 'center'},
  card: {borderRadius: radii.lg, padding: 20, gap: 12},
  cardTitle: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.bold},
  cardBody: {fontSize: fontSize.message, lineHeight: 22},
  primaryBtn: {
    borderRadius: radii.md,
    paddingVertical: 13,
    alignItems: 'center',
  },
  primaryText: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
  linkBtn: {paddingVertical: 8, alignItems: 'center'},
  linkText: {fontSize: fontSize.message, fontWeight: fontWeight.medium},
  limited: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: GAP,
  },
  limitedText: {flex: 1, fontSize: 13},
  limitedLink: {fontSize: 14, fontWeight: fontWeight.bold},
  loader: {paddingVertical: 16},
  empty: {textAlign: 'center', padding: 32},
});
