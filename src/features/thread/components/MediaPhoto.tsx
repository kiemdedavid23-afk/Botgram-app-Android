/**
 * Photo dans une bulle — auto DL si size <= 2 Mo, sinon bouton.
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
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import NetInfo from '@react-native-community/netinfo';

type Props = {
  messageId: string;
  size?: number | null;
  caption?: string | null;
};

export function MediaPhoto({
  messageId,
  size,
  caption,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);
  const [needTap, setNeedTap] = useState(false);
  const alive = useRef(true);

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
      const res = await loadAttachmentToStorage(messageId, signal);
      if (!alive.current) return;
      setLoading(false);
      if (!res.ok) {
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

  const sizeLabel =
    size && size >= 1024 * 1024
      ? t.mediaSizeMb(size)
      : size
        ? t.mediaSizeKb(size)
        : '';

  return (
    <View>
      {loading ? (
        <View style={styles.box}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{color: colors.textHint}}>{t.mediaLoading}</Text>
        </View>
      ) : null}
      {needTap ? (
        <Pressable
          onPress={() => fireAndForget(runDownload())}
          style={styles.box}>
          <Text style={{color: colors.accent}}>
            {t.mediaDownload(sizeLabel)}
          </Text>
        </Pressable>
      ) : null}
      {error ? (
        <Pressable
          onPress={() => fireAndForget(runDownload())}
          style={styles.box}>
          <Text style={{color: colors.danger}}>{error}</Text>
          <Text style={{color: colors.accent}}>{t.mediaRetry}</Text>
        </Pressable>
      ) : null}
      {uri ? (
        <Pressable onPress={() => setFull(true)}>
          <Image
            source={{uri}}
            style={styles.photo}
            resizeMode="cover"
            resizeMethod="resize"
          />
        </Pressable>
      ) : null}
      {caption ? (
        <Text style={{color: colors.textPrimary, marginTop: tm.timeMarginT}}>
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
  photo: {
    width: '100%' as const,
    maxHeight: tm.mediaPhotoMaxH,
    height: tm.mediaPhotoMaxH,
    borderRadius: tm.mediaPhotoRadius,
  },
  box: {
    minHeight: tm.mediaBoxMinH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tm.mediaBoxGap,
  },
  modal: {flex: 1, justifyContent: 'center'},
  zoom: {flexGrow: 1, justifyContent: 'center', alignItems: 'center'},
});
