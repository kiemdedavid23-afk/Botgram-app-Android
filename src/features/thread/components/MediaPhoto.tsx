/**
 * Photo dans une bulle — proportions réelles respectées (pas de recadrage),
 * auto DL si size <= 2 Mo, sinon bouton.
 */
import React, {useEffect, useRef, useState, useCallback} from 'react';
import {
  View,
  Image,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
  Modal,
  ScrollView,
  useWindowDimensions,
} from 'react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {loadAttachmentToStorage} from '../../../core/media/loadAttachment';
import {rememberDownloadMeta} from '../../../core/media/downloadMeta';
import {openImageViewer} from '../../../core/media/imageViewer';
import {buildPhotoGallery} from '../photoGallery';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import NetInfo from '@react-native-community/netinfo';

type Props = {
  messageId: string;
  size?: number | null;
  caption?: string | null;
  /** Cellule d'album : dimensions imposées. */
  fixedWidth?: number;
  fixedHeight?: number;
  /** Rayon des coins (0 dans un album). */
  radius?: number;
};

export function MediaPhoto({
  messageId,
  size,
  caption,
  fixedWidth,
  fixedHeight,
  radius,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const alive = useRef(true);
  const [natural, setNatural] = useState<{w: number; h: number} | null>(null);

  // Visionneuse native (zoom, glisser entre les photos, enregistrer, partager).
  // Si elle n'est pas disponible, on garde l'ancien affichage plein écran.
  const openViewer = useCallback(async () => {
    if (!uri) return;
    const gallery = await buildPhotoGallery(messageId, uri);
    if (!openImageViewer(gallery.items, gallery.index)) setFull(true);
  }, [messageId, uri]);

  const runDownload = useCallback(
    async (signal?: AbortSignal) => {
      if (alive.current) {
        setLoading(true);
        setError(null);
        setNeedTap(false);
      }
      const net = await NetInfo.fetch();
      if (net.isConnected === false) {
        if (alive.current) {
          setError(t.mediaOffline);
          setLoading(false);
        }
        return;
      }
      rememberDownloadMeta(messageId, 'photo');
      const res = await loadAttachmentToStorage(messageId, signal);
      if (!alive.current) return;
      setLoading(false);
      if (!res.ok) {
        // Annulé depuis la notification : on propose de relancer, sans message d'erreur.
        if (res.code === 'cancelled') {
          setNeedTap(true);
          return;
        }
        setError(
          res.code === 'PAYLOAD_TOO_LARGE'
            ? t.mediaTooLarge
            : t.mediaLoadError,
        );
        return;
      }
      setUri(`file://${res.path}`);
    },
    [messageId],
  );

  const bootstrap = useCallback(
    async (signal: AbortSignal) => {
      const storage = getMediaStorage();
      if (await storage.exists(messageId)) {
        if (alive.current) {
          setUri(`file://${storage.localPath(messageId)}`);
        }
        return;
      }
      const auto =
        size === null ||
        size === undefined ||
        size <= tm.autoDownloadMaxBytes;
      if (!auto) {
        if (alive.current) setNeedTap(true);
        return;
      }
      await runDownload(signal);
    },
    [messageId, size, runDownload],
  );

  useEffect(() => {
    alive.current = true;
    const controller = new AbortController();
    fireAndForget(bootstrap(controller.signal));
    return () => {
      alive.current = false;
      controller.abort();
    };
  }, [bootstrap]);

  // Dimensions réelles de l'image, pour une bulle à ses proportions.
  useEffect(() => {
    if (!uri || fixedWidth !== undefined) return undefined;
    Image.getSize(
      uri,
      (w, h) => {
        if (alive.current && w > 0 && h > 0) setNatural({w, h});
      },
      () => {},
    );
    return undefined;
  }, [uri, fixedWidth]);

  const maxW = Math.min(
    Math.round(width * tm.bubbleMaxWidthPct) - 2 * tm.mediaBubblePad,
    tm.mediaMaxWidth,
  );
  let boxW: number;
  let boxH: number;
  if (fixedWidth !== undefined && fixedHeight !== undefined) {
    boxW = fixedWidth;
    boxH = fixedHeight;
  } else if (natural) {
    const ratio = natural.w / natural.h;
    boxW = maxW;
    boxH = Math.round(boxW / ratio);
    if (boxH > tm.mediaMaxHeight) {
      boxH = tm.mediaMaxHeight;
      boxW = Math.max(tm.mediaMinWidth, Math.round(boxH * ratio));
    }
    boxH = Math.max(boxH, tm.mediaMinHeight);
  } else {
    boxW = Math.round(maxW * 0.7);
    boxH = Math.round(boxW * 0.75);
  }
  const corner = radius ?? tm.mediaPhotoRadius;
  const boxStyle = {width: boxW, height: boxH};

  const sizeLabel =
    size && size >= 1024 * 1024
      ? t.mediaSizeMb(size)
      : size
        ? t.mediaSizeKb(size)
        : '';

  return (
    <View style={{width: boxW}}>
      {loading ? (
        <View style={[styles.box, boxStyle]}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{color: colors.textHint}}>{t.mediaLoading}</Text>
        </View>
      ) : null}
      {needTap ? (
        <Pressable
          onPress={() => fireAndForget(runDownload())}
          style={[styles.box, boxStyle]}>
          <Text style={{color: colors.accent}}>
            {t.mediaDownload(sizeLabel)}
          </Text>
        </Pressable>
      ) : null}
      {error ? (
        <Pressable
          onPress={() => fireAndForget(runDownload())}
          style={[styles.box, boxStyle]}>
          <Text style={{color: colors.danger}}>{error}</Text>
          <Text style={{color: colors.accent}}>{t.mediaRetry}</Text>
        </Pressable>
      ) : null}
      {uri ? (
        <Pressable onPress={() => fireAndForget(openViewer())}>
          <Image
            source={{uri}}
            style={[boxStyle, {borderRadius: corner}]}
            resizeMode="cover"
            resizeMethod="resize"
          />
        </Pressable>
      ) : null}
      {caption ? (
        <Text
          style={[
            styles.caption,
            {color: colors.textPrimary, width: boxW},
          ]}>
          {caption}
        </Text>
      ) : null}
      <Modal visible={full} transparent animationType="fade">
        <Pressable
          style={[styles.modal, {backgroundColor: colors.overlay}]}
          onPress={() => setFull(false)}>
          <ScrollView
            maximumZoomScale={3}
            minimumZoomScale={1}
            contentContainerStyle={styles.zoom}>
            {uri ? (
              <Image
                source={{uri}}
                style={{width, height: height * 0.8}}
                resizeMode="contain"
              />
            ) : null}
          </ScrollView>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  caption: {
    paddingHorizontal: tm.bubblePadH - tm.mediaBubblePad,
    paddingTop: 4,
  },
  box: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: tm.mediaBoxGap,
  },
  modal: {flex: 1, justifyContent: 'center'},
  zoom: {flexGrow: 1, justifyContent: 'center', alignItems: 'center'},
});
