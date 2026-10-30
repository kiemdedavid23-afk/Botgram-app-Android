/**
 * Onglet Fichier : le sélecteur de fichiers du système (aucune permission requise).
 * L'explorateur intégré (stockage interne, récents) viendra dans une version dédiée.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {FolderOpen} from 'lucide-react-native';
import {useTheme, radii, fontSize, fontWeight} from '../../../shared/theme';
import {attachTexts as t} from './texts';

type Props = {onBrowse: () => void};

export function FileTab({onBrowse}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.wrap}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <Pressable
          accessibilityRole="button"
          onPress={onBrowse}
          style={({pressed}) => [
            styles.row,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <View style={[styles.circle, {backgroundColor: '#34C759'}]}>
            <FolderOpen size={24} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text style={[styles.title, {color: colors.textPrimary}]}>
              {t.fileBrowse}
            </Text>
            <Text style={[styles.sub, {color: colors.textSecondary}]}>
              {t.fileBrowseSub}
            </Text>
          </View>
        </Pressable>
      </View>
      <Text style={[styles.hint, {color: colors.textHint}]}>{t.fileHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {padding: 16, gap: 12},
  card: {borderRadius: radii.lg, overflow: 'hidden'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
  },
  circle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1, gap: 2},
  title: {fontSize: fontSize.msgDefault + 1, fontWeight: fontWeight.medium},
  sub: {fontSize: fontSize.message},
  hint: {fontSize: 13, paddingHorizontal: 4},
});
