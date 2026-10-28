/**
 * Archives à la Telegram :
 *  - ArchiveRow : ligne « Échanges archivés » en haut de la liste (ouvre le dossier archive) ;
 *  - ArchiveHeader : en-tête du dossier archive, avec retour.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Archive, ArrowLeft} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t} from '../texts';

type RowProps = {
  count: number;
  /** Noms des conversations archivées (aperçu sur une ligne). */
  preview: string;
  onPress: () => void;
};

export function ArchiveRow({count, preview, onPress}: RowProps): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${t.archivedTitle}, ${count}`}
      style={({pressed}) => [
        styles.row,
        {backgroundColor: pressed ? colors.bgTertiary : 'transparent'},
      ]}>
      <View style={[styles.icon, {backgroundColor: colors.textHint}]}>
        <Archive size={cm.archiveIconSize} color={colors.white} strokeWidth={1.8} />
      </View>
      <View style={styles.content}>
        <Text
          numberOfLines={1}
          style={[styles.title, {color: colors.textPrimary}]}>
          {t.archivedTitle}
        </Text>
        <Text
          numberOfLines={1}
          style={[styles.preview, {color: colors.textSecondary}]}>
          {preview}
        </Text>
      </View>
      <View style={[styles.count, {backgroundColor: colors.bgTertiary}]}>
        <Text style={[styles.countText, {color: colors.textSecondary}]}>{count}</Text>
      </View>
    </Pressable>
  );
}

type HeaderProps = {count: number; onBack: () => void};

export function ArchiveHeader({count, onBack}: HeaderProps): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        hitSlop={12}
        accessibilityRole="button"
        accessibilityLabel={t.archivedBack}
        style={styles.back}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </Pressable>
      <Text style={[styles.headerTitle, {color: colors.textPrimary}]} numberOfLines={1}>
        {t.archivedTitle}
      </Text>
      <View style={[styles.count, {backgroundColor: colors.bgTertiary}]}>
        <Text style={[styles.countText, {color: colors.textSecondary}]}>{count}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.itemGap,
    paddingVertical: cm.archiveRowPadV,
    paddingHorizontal: cm.itemPaddingH,
  },
  icon: {
    width: cm.avatarSize,
    height: cm.avatarSize,
    borderRadius: cm.avatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {flex: 1, minWidth: 0, gap: cm.contentGap},
  title: {fontSize: cm.titleSize + 2, fontWeight: fontWeight.semibold},
  preview: {fontSize: cm.previewSize},
  count: {
    minWidth: cm.archiveCountMin,
    height: cm.archiveCountMin,
    paddingHorizontal: cm.badgePadH,
    borderRadius: cm.archiveCountMin / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {fontSize: cm.badgeFontSize + 1, fontWeight: fontWeight.bold},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.itemGap,
    paddingHorizontal: cm.itemPaddingH,
    paddingTop: cm.foldersPaddingT,
    paddingBottom: cm.foldersPaddingB,
  },
  back: {width: 32, height: 32, alignItems: 'center', justifyContent: 'center'},
  headerTitle: {flex: 1, fontSize: cm.titleSize + 3, fontWeight: fontWeight.semibold},
});
