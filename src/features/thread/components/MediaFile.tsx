/**
 * Document dans une bulle (rendu type Telegram) :
 * rond avec icône (flèche si pas encore sur le téléphone), nom, taille + extension.
 */
import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  useWindowDimensions,
} from 'react-native';
import {File, ArrowDown} from 'lucide-react-native';
import {useTheme, useChatTheme, fontWeight} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {loadAttachmentToStorage} from '../../../core/media/loadAttachment';
import {openMediaFile} from '../../../core/storage/mediaFiles';
import {getMediaStorage} from '../../../core/media/MediaStorage';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {rememberDownloadMeta} from '../../../core/media/downloadMeta';
import NetInfo from '@react-native-community/netinfo';

type Props = {
  messageId: string;
  name?: string | null;
  size?: number | null;
  mime?: string | null;
  /** Message envoyé par le membre (couleurs de la bulle sortante). */
  isOut?: boolean;
  /** Largeur imposée (sinon : largeur max de la bulle). */
  width?: number;
};

function formatSize(n: number | null | undefined): string {
  if (n === null || n === undefined || n <= 0) return '';
  if (n >= 1024 * 1024) return t.mediaSizeMb(n);
  return t.mediaSizeKb(n);
}

function extensionOf(name?: string | null): string {
  if (!name || !name.includes('.')) return '';
  return (name.split('.').pop() ?? '').toUpperCase();
}

export function MediaFile({
  messageId,
  name,
  size,
  mime,
  isOut,
  width,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const chat = useChatTheme();
  const {width: winW} = useWindowDimensions();
  const [loading, setLoading] = useState(false);
  const [local, setLocal] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Largeur explicite : sans elle, la bulle (qui s'ajuste à son contenu) s'écrase.
  const boxW =
    width ??
    Math.min(
      Math.round(winW * tm.bubbleMaxWidthPct) - 2 * tm.bubblePadH,
      tm.mediaFileMaxWidth,
    );

  useEffect(() => {
    let alive = true;
    fireAndForget(
      getMediaStorage()
        .exists(messageId)
        .then(ok => {
          if (alive) setLocal(ok);
        }),
    );
    return () => {
      alive = false;
    };
  }, [messageId]);

  const onPress = () => {
    setLoading(true);
    setError(null);
    fireAndForget(
      (async () => {
        const storage = getMediaStorage();
        if (!(await storage.exists(messageId))) {
          const net = await NetInfo.fetch();
          if (net.isConnected === false) {
            setError(t.mediaOffline);
            setLoading(false);
            return;
          }
          rememberDownloadMeta(messageId, 'document', name);
          const res = await loadAttachmentToStorage(messageId);
          if (!res.ok) {
            setLoading(false);
            // Annulé depuis la notification : pas de message d'erreur.
            if (res.code !== 'cancelled') {
              setError(
                res.code === 'PAYLOAD_TOO_LARGE'
                  ? t.mediaTooLarge
                  : t.mediaLoadError,
              );
            }
            return;
          }
        }
        setLocal(true);
        const opened = await openMediaFile(messageId, mime);
        setLoading(false);
        if (!opened.ok) {
          setError(
            opened.code === 'no_handler' ? t.mediaNoHandler : t.mediaLoadError,
          );
        }
      })(),
    );
  };

  const circleBg = isOut ? colors.white : colors.accent;
  const iconColor = isOut ? chat.bubbleOut : colors.white;
  const textColor = isOut ? chat.bubbleOutText : chat.bubbleInText;
  const subColor = isOut ? chat.timeOut : chat.timeIn;
  const subtitle = [formatSize(size), extensionOf(name)]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable onPress={onPress} style={[styles.row, {width: boxW}]}>
      <View style={[styles.circle, {backgroundColor: circleBg}]}>
        {loading ? (
          <ActivityIndicator color={iconColor} />
        ) : local ? (
          <File size={tm.mediaFileIconSize} color={iconColor} strokeWidth={2} />
        ) : (
          <ArrowDown
            size={tm.mediaFileIconSize}
            color={iconColor}
            strokeWidth={2}
          />
        )}
      </View>
      <View style={styles.meta}>
        <Text
          numberOfLines={2}
          style={{color: textColor, fontWeight: fontWeight.semibold}}>
          {name ?? t.kindDocument}
        </Text>
        {subtitle ? (
          <Text style={{color: subColor, fontSize: tm.retryBtnFont}}>
            {subtitle}
          </Text>
        ) : null}
        {error ? (
          <Text style={{color: colors.danger, fontSize: tm.retryBtnFont}}>
            {error}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 2,
  },
  circle: {
    width: tm.mediaFileCircle,
    height: tm.mediaFileCircle,
    borderRadius: tm.mediaFileCircle / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {flex: 1, minWidth: 0},
});
