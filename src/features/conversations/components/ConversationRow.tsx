import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Pin} from 'lucide-react-native';
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
      onPress={onPress}
      onLongPress={() => setMenuOpen(true)}
      style={({pressed}) => [
        styles.item,
        {
          paddingVertical: cm.itemPaddingV + densityPad,
          paddingHorizontal: cm.itemPaddingH,
          backgroundColor: pressed ? colors.bgTertiary : 'transparent',
        },
      ]}>
      {onPressAvatar ? (
        <Pressable
          onPress={onPressAvatar}
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
  previewFlex: {flex: cm.previewFlex},
  badge: {
    height: cm.badgeMinSize,
    borderRadius: cm.badgeMinSize / 2,
    paddingHorizontal: cm.badgePadH,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
