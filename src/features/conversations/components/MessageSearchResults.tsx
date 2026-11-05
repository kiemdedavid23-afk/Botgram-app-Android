import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {conversationsMetrics as cm} from '../../../shared/theme/conversationsMetrics';
import {conversationsTexts as t, formatConversationTime} from '../texts';
import type {MessageSearchHit} from '../../../core/archive/ftsRepo';

type Props = {
  hits: MessageSearchHit[];
  onOpen?: (conversationId: string) => void;
};

/** Section « Messages » sous les conversations trouvées. */
export function MessageSearchResults({
  hits,
  onOpen,
}: Props): React.JSX.Element | null {
  const {colors} = useTheme();
  if (hits.length === 0) {
    return null;
  }
  return (
    <View>
      <Text style={[styles.header, {color: colors.accent}]}>
        {t.messagesSection}
      </Text>
      {hits.map(hit => (
        <Pressable
          key={hit.messageId}
          accessibilityRole="button"
          accessibilityLabel={hit.conversationTitle}
          onPress={() => onOpen?.(hit.conversationId)}
          android_ripple={{color: colors.accentSoft}}
          style={styles.row}>
          <View style={styles.top}>
            <Text
              style={[styles.title, {color: colors.textPrimary}]}
              numberOfLines={1}>
              {hit.conversationTitle}
            </Text>
            <Text style={[styles.time, {color: colors.textSecondary}]}>
              {formatConversationTime(hit.createdAt ?? undefined)}
            </Text>
          </View>
          <Text
            style={[styles.snippet, {color: colors.textSecondary}]}
            numberOfLines={2}>
            {hit.direction === 'out' ? t.messageFromYou : ''}
            {hit.segments.map((seg, i) => (
              <Text
                key={`${hit.messageId}-${i}`}
                style={
                  seg.hit
                    ? {color: colors.accent, fontWeight: fontWeight.semibold}
                    : undefined
                }>
                {seg.text}
              </Text>
            ))}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    fontSize: cm.msgSearchHeaderSize,
    fontWeight: fontWeight.semibold,
    paddingHorizontal: cm.msgSearchPadH,
    paddingVertical: cm.msgSearchHeaderPadV,
  },
  row: {
    paddingHorizontal: cm.msgSearchPadH,
    paddingVertical: cm.msgSearchPadV,
    gap: cm.msgSearchGap,
  },
  top: {flexDirection: 'row', alignItems: 'center', gap: cm.rowGap},
  title: {
    flex: 1,
    fontSize: cm.msgSearchTitleSize,
    fontWeight: fontWeight.semibold,
  },
  time: {fontSize: cm.msgSearchTimeSize},
  snippet: {fontSize: cm.msgSearchSnippetSize},
});
