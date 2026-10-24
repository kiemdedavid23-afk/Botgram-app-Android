import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Pin} from 'lucide-react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {stripPreview} from '../../../core/utils/stripPreview';
import {formatConversationTime} from '../texts';
import {conversationTitle} from '../store/conversationsStore';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

type Props = {
  item: ConversationSummary;
  densityPad: number;
  hideBadge: boolean;
  onPress?: () => void;
};

export function ConversationRow({
  item,
  densityPad,
  hideBadge,
  onPress,
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
      style={({pressed}) => [
        styles.item,
        {
          paddingVertical: cm.itemPaddingV + densityPad,
          paddingHorizontal: cm.itemPaddingH,
          backgroundColor: pressed ? colors.bgTertiary : 'transparent',
        },
      ]}>
      <Avatar
        photoUrl={item.photo_url}
        initials={item.initials}
        title={title}
      />
      <View style={styles.content}>
        <View style={styles.row}>
          <View style={styles.titleRow}>
            {item.pinned ? (
              <Pin
                size={14}
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
            style={[styles.preview, styles.previewFlex, {color: colors.textSecondary}]}>
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
  content: {flex: 1, minWidth: 0, gap: cm.contentGap},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  title: {fontSize: cm.titleSize, flexShrink: 1},
  preview: {fontSize: cm.previewSize},
  badge: {
    height: cm.badgeMinSize,
    borderRadius: cm.badgeMinSize / 2,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
