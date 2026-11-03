/**
 * Réglages — stockage local (médias chiffrés + taille archive).
 */
import React, {useCallback, useState} from 'react';
import {View, Text, Pressable, Alert, StyleSheet} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';
import {getMediaStorage} from '../../core/media/MediaStorage';
import {settingsStorageTexts as t} from './texts';
import {useTheme} from '../../shared/theme';
import {fireAndForget} from '../../core/utils/fireAndForget';

type Props = {
  archiveBytes?: number;
};

export function StorageSettingsScreen({
  archiveBytes = 0,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [mediaBytes, setMediaBytes] = useState(0);

  const refresh = useCallback(() => {
    fireAndForget(
      getMediaStorage()
        .totalSize()
        .then(n => setMediaBytes(n)),
    );
  }, []);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh]),
  );

  const onClear = () => {
    Alert.alert(t.clearConfirmTitle, t.clearConfirmBody, [
      {text: t.clearConfirmCancel, style: 'cancel'},
      {
        text: t.clearConfirmOk,
        style: 'destructive',
        onPress: () => {
          fireAndForget(
            getMediaStorage()
              .clearAll()
              .then(() => setMediaBytes(0)),
          );
        },
      },
    ]);
  };

  return (
    <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
      <Text
        style={[styles.title, {color: colors.textPrimary}]}
        accessibilityRole="header">
        {t.title}
      </Text>
      <Text style={{color: colors.textSecondary}}>{t.spaceUsed}</Text>
      <Text
        style={[styles.row, {color: colors.textPrimary}]}
        accessibilityLabel={`${t.mediaFiles} ${t.bytes(mediaBytes)}`}>
        {t.mediaFiles}: {t.bytes(mediaBytes)}
      </Text>
      <Text
        style={[styles.row, {color: colors.textPrimary}]}
        accessibilityLabel={`${t.archiveDb} ${t.bytes(archiveBytes)}`}>
        {t.archiveDb}: {t.bytes(archiveBytes)}
      </Text>
      <Pressable
        onPress={onClear}
        accessibilityRole="button"
        accessibilityLabel={t.clearMedia}
        style={[styles.btn, {backgroundColor: colors.danger}]}>
        <Text style={[styles.btnText, {color: colors.bgPrimary}]}>
          {t.clearMedia}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, padding: 16, gap: 12},
  title: {fontSize: 20, fontWeight: '600'},
  row: {fontSize: 16},
  btn: {padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 16},
  btnText: {fontWeight: '600'},
});
