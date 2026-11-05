/**
 * Réglages — stockage local : taille des médias, taille de l'archive,
 * « Vider les médias » (avec confirmation). Les messages ne sont jamais touchés.
 */
import React, {useCallback, useEffect, useState} from 'react';
import {Text, Pressable, Alert, StyleSheet} from 'react-native';
import {getMediaStorage} from '../../core/media/MediaStorage';
import {getArchiveStore} from '../../core/archive';
import {useTheme, settingsMetrics as sm, fontWeight} from '../../shared/theme';
import {fireAndForget} from '../../core/utils/fireAndForget';
import {SettingsPage} from './components/SettingsPage';
import {SettingsCard, CardTitle, RowDivider} from './components/ui';
import {settingsStorageTexts as t} from './storageTexts';

type Props = {onBack: () => void};

async function readSize(read: () => Promise<number>): Promise<number | null> {
  try {
    return await read();
  } catch {
    return null;
  }
}

function sizeLabel(bytes: number | null): string {
  return bytes === null ? t.unavailable : t.bytes(bytes);
}

export function StorageSettingsScreen({onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [mediaBytes, setMediaBytes] = useState<number | null>(0);
  const [archiveBytes, setArchiveBytes] = useState<number | null>(0);
  const [done, setDone] = useState(false);

  const refresh = useCallback(async () => {
    setMediaBytes(await readSize(() => getMediaStorage().totalSize()));
    setArchiveBytes(await readSize(() => getArchiveStore().sizeBytes()));
  }, []);

  useEffect(() => {
    fireAndForget(refresh());
  }, [refresh]);

  const clearMedia = useCallback(async () => {
    await getMediaStorage().clearAll();
    setDone(true);
    await refresh();
  }, [refresh]);

  const onClear = () => {
    Alert.alert(t.clearConfirmTitle, t.clearConfirmBody, [
      {text: t.clearConfirmCancel, style: 'cancel'},
      {
        text: t.clearConfirmOk,
        style: 'destructive',
        onPress: () => fireAndForget(clearMedia()),
      },
    ]);
  };

  return (
    <SettingsPage title={t.title} onBack={onBack}>
      <SettingsCard>
        <CardTitle>{t.spaceUsed}</CardTitle>
        <Text
          style={[styles.row, {color: colors.textPrimary}]}
          accessibilityLabel={`${t.mediaFiles} ${sizeLabel(mediaBytes)}`}>
          {t.mediaFiles} : {sizeLabel(mediaBytes)}
        </Text>
        <RowDivider />
        <Text
          style={[styles.row, {color: colors.textPrimary}]}
          accessibilityLabel={`${t.archiveDb} ${sizeLabel(archiveBytes)}`}>
          {t.archiveDb} : {sizeLabel(archiveBytes)}
        </Text>
        <Text style={[styles.note, {color: colors.textSecondary}]}>
          {t.archiveNote}
        </Text>
      </SettingsCard>
      <SettingsCard style={styles.action}>
        <Pressable
          onPress={onClear}
          accessibilityRole="button"
          accessibilityLabel={t.clearMedia}
          android_ripple={{color: colors.accentSoft}}
          style={styles.btn}>
          <Text style={[styles.btnText, {color: colors.danger}]}>
            {t.clearMedia}
          </Text>
        </Pressable>
        {done ? (
          <Text style={[styles.note, {color: colors.textSecondary}]}>
            {t.clearDone}
          </Text>
        ) : null}
      </SettingsCard>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  row: {fontSize: sm.subSize + 2, paddingHorizontal: 20, paddingVertical: 14},
  note: {fontSize: sm.subSize, paddingHorizontal: 20, paddingBottom: 14},
  action: {marginTop: 12},
  btn: {minHeight: 56, justifyContent: 'center', paddingHorizontal: 20},
  btnText: {fontSize: sm.subSize + 3, fontWeight: fontWeight.semibold},
});
