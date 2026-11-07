import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Pin, Check} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {stripPreview} from '../../../core/utils/stripPreview';
import {formatConversationTime} from '../texts';
import {conversationTitle} from '../store/conversationsStore';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {ConversationActionsSheet} from './ConversationActionsSheet';
import {
  buildConversationMenu,
  confirmDeleteConversation,
  conversationSubtitle,
} from './conversationMenu';

type Props = {
  item: ConversationSummary;
  densityPad: number;
  hideBadge: boolean;
  onPress?: () => void;
  /** Appui sur la photo uniquement → profil contact. */
  onPressAvatar?: () => void;
  onPin?: (id: string, pinned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<boolean>;
  onArchive?: (id: string) => void;
  onUnarchive?: (id: string) => void;
  archived?: boolean;
  /** Action préférée (réglage Discussions) — mise en avant dans le menu. */
  swipeAction?: 'archive' | 'folder' | 'pin';
  /** Mode sélection : un appui coche / décoche la ligne. */
  selectionMode?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
};

export function ConversationRow({
  item,
  densityPad,
  hideBadge,
  onPress,
  onPressAvatar,
  onPin,
  onDelete,
  onArchive,
  onUnarchive,
  archived = false,
  swipeAction = 'folder',
  selectionMode = false,
  selected = false,
  onToggleSelect,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const title = conversationTitle(item);
  const preview = stripPreview(item.last_message_text);
  const time = formatConversationTime(item.last_message_at);
  const unread = item.unread_count ?? 0;
  const showBadge = !hideBadge && unread > 0;
  const [menuOpen, setMenuOpen] = useState(false);
  const pinned = !!item.pinned;
  const groups = buildConversationMenu({
    pinned,
    archived,
    onViewProfile: onPressAvatar,
    onTogglePin: () => {
      if (onPin) fireAndForget(onPin(item.id, !pinned));
    },
    onToggleArchive: () => {
      if (archived) onUnarchive?.(item.id);
      else onArchive?.(item.id);
    },
    onDelete: () =>
      confirmDeleteConversation(() => {
        if (onDelete) fireAndForget(onDelete(item.id));
      }),
  });

  return (
    <>
    <Pressable
      onPress={selectionMode ? onToggleSelect : onPress}
      onLongPress={selectionMode ? onToggleSelect : () => setMenuOpen(true)}
      accessibilityState={{selected}}
      style={({pressed}) => [
        styles.item,
        {
          paddingVertical: cm.itemPaddingV + densityPad,
          paddingHorizontal: cm.itemPaddingH,
          backgroundColor: selected
            ? colors.accentSoft
            : pressed
              ? colors.bgTertiary
              : 'transparent',
        },
      ]}>
      <View>
        {onPressAvatar ? (
          <Pressable
            onPress={selectionMode ? onToggleSelect : onPressAvatar}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel={title}>
            <Avatar
              photoUrl={item.photo_url}
              initials={item.initials}
              title={title}
            />
          </Pressable>
        ) : (
          <Avatar
            photoUrl={item.photo_url}
            initials={item.initials}
            title={title}
          />
        )}
        {selected ? (
          <View
            style={[
              styles.check,
              {backgroundColor: colors.accent, borderColor: colors.bgPrimary},
            ]}>
            <Check size={12} color={colors.white} strokeWidth={3} />
          </View>
        ) : null}
      </View>
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.titleRow}>
            {item.pinned ? (
              <Pin
                size={cm.pinIconSize}
                color={colors.textSecondary}
                strokeWidth={2}
              />
            ) : null}
            <Text
              numberOfLines={1}
              style={[
                styles.title,
                {color: colors.textPrimary, fontWeight: fontWeight.semibold},
              ]}>
              {title}
            </Text>
          </View>
          <Text
            style={{
              color: showBadge ? colors.accent : colors.textHint,
              fontSize: cm.timeSize,
              fontWeight: showBadge ? fontWeight.semibold : fontWeight.regular,
            }}>
            {time}
          </Text>
        </View>
        {item.assigned_to ? (
          <Text numberOfLines={1} style={[styles.assigned, {color: colors.accent}]}>
            {`→ ${item.assigned_to.display_name}`}
          </Text>
        ) : null}
        <View style={styles.row}>
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              styles.previewFlex,
              {color: showBadge ? colors.textPrimary : colors.textSecondary},
            ]}>
            {preview}
          </Text>
          {showBadge ? (
            <View
              style={[
                styles.badge,
                {backgroundColor: colors.accent, minWidth: cm.badgeMinSize},
              ]}>
              <Text
                style={{
                  color: colors.white,
                  fontSize: cm.badgeFontSize,
                  fontWeight: fontWeight.bold,
                }}>
                {unread > 99 ? '99+' : String(unread)}
              </Text>
            </View>
          ) : null}
        </View>
      </View>
    </Pressable>
    <ConversationActionsSheet
      visible={menuOpen}
      onClose={() => setMenuOpen(false)}
      title={title}
      subtitle={conversationSubtitle(item)}
      photoUrl={item.photo_url}
      initials={item.initials}
      groups={groups}
      highlightId={
        swipeAction === 'pin'
          ? 'pin'
          : swipeAction === 'archive'
            ? 'archive'
            : undefined
      }
    />
    </>
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.itemGap,
  },
  check: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {flex: 1, minWidth: 0, gap: cm.contentGap},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: cm.rowGap,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: cm.titleRowGap,
  },
  title: {fontSize: cm.titleSize, flexShrink: 1},
  preview: {fontSize: cm.previewSize},
  assigned: {fontSize: 11.5, fontWeight: '700', marginTop: 1},
  previewFlex: {flex: cm.previewFlex},
  badge: {
    height: cm.badgeMinSize,
    borderRadius: cm.badgeMinSize / 2,
    paddingHorizontal: cm.badgePadH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
