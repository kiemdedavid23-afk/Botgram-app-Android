/**
 * Photo dans une bulle — télécharge via MediaStorage, file:// local.
 */
import React, {useEffect, useState} from 'react';
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
  caption?: string | null;
};

export function MediaPhoto({messageId, caption}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const {width, height} = useWindowDimensions();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [full, setFull] = useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    fireAndForget(
      (async () => {
        const storage = getMediaStorage();
        if (await storage.exists(messageId)) {
          setUri(`file://${storage.localPath(messageId)}`);
          setLoading(false);
          return;
        }
        const net = await NetInfo.fetch();
        if (net.isConnected === false) {
          setError(t.mediaOffline);
          setLoading(false);
          return;
        }
        const res = await loadAttachmentToStorage(messageId);
        if (!res.ok) {
          setError(
            res.code === 'PAYLOAD_TOO_LARGE'
              ? t.mediaTooLarge
              : t.mediaLoadError,
          );
          setLoading(false);
          return;
        }
        setUri(`file://${res.path}`);
        setLoading(false);
      })(),
    );
  }, [messageId]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View>
      {loading ? (
        <View style={styles.box}>
          <ActivityIndicator color={colors.accent} />
          <Text style={{color: colors.textHint}}>{t.mediaLoading}</Text>
        </View>
      ) : null}
      {error ? (
        <Pressable onPress={load} style={styles.box}>
          <Text style={{color: colors.danger}}>{error}</Text>
          <Text style={{color: colors.accent}}>{t.mediaRetry}</Text>
        </Pressable>
      ) : null}
      {uri ? (
        <Pressable onPress={() => setFull(true)}>
          <Image
            source={{uri}}
            style={{
              width: '100%',
              maxHeight: tm.mediaPhotoMaxH,
              height: tm.mediaPhotoMaxH,
              borderRadius: tm.mediaPhotoRadius,
            }}
            resizeMode="cover"
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
  box: {
    minHeight: tm.mediaBoxMinH,
    alignItems: 'center',
    justifyContent: 'center',
    gap: tm.mediaBoxGap,
  },
  modal: {flex: 1, justifyContent: 'center'},
  zoom: {flexGrow: 1, justifyContent: 'center', alignItems: 'center'},
});
