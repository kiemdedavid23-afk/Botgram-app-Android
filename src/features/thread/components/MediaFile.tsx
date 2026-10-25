import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {File} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {loadAttachmentToStorage} from '../../../core/media/loadAttachment';
import {threadTexts as t} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import NetInfo from '@react-native-community/netinfo';

type Props = {
  messageId: string;
  name?: string | null;
  size?: number | null;
  mime?: string | null;
};

function formatSize(n: number | null | undefined): string {
  if (n === null || n === undefined || n <= 0) return '';
  if (n >= 1024 * 1024) return t.mediaSizeMb(n);
  return t.mediaSizeKb(n);
}

export function MediaFile({messageId, name, size}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  const onPress = () => {
    setLoading(true);
    setError(null);
    fireAndForget(
      (async () => {
        const net = await NetInfo.fetch();
        if (net.isConnected === false) {
          setError(t.mediaOffline);
          setLoading(false);
          return;
        }
        const res = await loadAttachmentToStorage(messageId);
        setLoading(false);
        if (!res.ok) {
          setError(
            res.code === 'PAYLOAD_TOO_LARGE'
              ? t.mediaTooLarge
              : t.mediaLoadError,
          );
          return;
        }
        setReady(true);
      })(),
    );
  };

  return (
    <Pressable
      onPress={onPress}
      style={[styles.row, {backgroundColor: colors.bgTertiary}]}>
      <File size={tm.mediaFileIconSize} color={colors.accent} strokeWidth={2} />
      <View style={styles.meta}>
        <Text style={{color: colors.textPrimary}} numberOfLines={2}>
          {name ?? t.kindDocument}
        </Text>
        <Text style={{color: colors.textHint, fontSize: tm.retryBtnFont}}>
          {formatSize(size)}
          {ready ? ` · ${t.mediaOpenDoc}` : ''}
        </Text>
        {error ? (
          <Text style={{color: colors.danger, fontSize: tm.retryBtnFont}}>
            {error}
          </Text>
        ) : null}
      </View>
      {loading ? <ActivityIndicator color={colors.accent} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.mediaAlbumGap + 6,
    padding: tm.mediaFilePad,
    borderRadius: tm.mediaPhotoRadius,
  },
  meta: {flex: 1, minWidth: 0},
});
