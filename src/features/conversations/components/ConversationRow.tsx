import React from 'react';
import {View, Text, Pressable, StyleSheet, Alert} from 'react-native';
import {Pin} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {stripPreview} from '../../../core/utils/stripPreview';
import {formatConversationTime} from '../texts';
import {conversationTitle} from '../store/conversationsStore';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {conversationsTexts as ct} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  item: ConversationSummary;
  densityPad: number;
  hideBadge: boolean;
  onPress?: () => void;
  /** Appui sur la photo uniquement → profil contact. */
  onPressAvatar?: () => void;
  onPin?: (id: string, pinned: boolean) => Promise<void>;
  onDelete?: (id: string) => Promise<boolean>;
};

export function ConversationRow({
  item,
  densityPad,
  hideBadge,
  onPress,
  onPressAvatar,
  onPin,
  onDelete,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const title = conversationTitle(item);
  const preview = stripPreview(item.last_message_text);
  const time = formatConversationTime(item.last_message_at);
  const unread = item.unread_count ?? 0;
  const showBadge = !hideBadge && unread > 0;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={() => {
        const pinned = !!item.pinned;
        const buttons: {
          text: string;
          style?: 'cancel' | 'destructive';
          onPress?: () => void;
        }[] = [
          {
            text: pinned ? ct.unpinAction : ct.pinAction,
            onPress: () => {
              if (onPin) fireAndForget(onPin(item.id, !pinned));
            },
          },
          {
            text: ct.deleteConversation,
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                ct.deleteConversationConfirmTitle,
                ct.deleteConversationConfirmBody,
                [
                  {text: ct.cancel, style: 'cancel'},
                  {
                    text: ct.deleteConversationConfirm2,
                    style: 'destructive',
                    onPress: () => {
                      if (onDelete) fireAndForget(onDelete(item.id));
                    },
                  },
                ],
              );
            },
          },
          {text: ct.cancel, style: 'cancel'},
        ];
        Alert.alert(conversationTitle(item), undefined, buttons);
      }}
      style={({pressed}) => [
        styles.item,
        {
          paddingVertical: cm.itemPaddingV + densityPad,
          paddingHorizontal: cm.itemPaddingH,
          backgroundColor: pressed ? colors.bgTertiary : 'transparent',
        },
      ]}>
      <Pressable
        onPress={e => {
          // Empêche l'ouverture du fil : photo seule → profil.
          e?.stopPropagation?.();
          onPressAvatar?.();
        }}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel={title}
        style={styles.avatarPress}>
        <Avatar
          photoUrl={item.photo_url}
          initials={item.initials}
          title={title}
        />
      </Pressable>
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
          <Text style={{color: colors.textHint, fontSize: cm.timeSize}}>
            {time}
          </Text>
        </View>
        <View style={styles.row}>
          <Text
            numberOfLines={1}
            style={[
              styles.preview,
              styles.previewFlex,
              {color: colors.textSecondary},
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
  );
}

const styles = StyleSheet.create({
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cm.itemGap,
  },
  avatarPress: {
    // Zone tactile dédiée à la photo (le parent ouvre le fil).
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
