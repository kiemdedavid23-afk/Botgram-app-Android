/**
 * Écran profil contact — même structure visuelle que MemberProfileScreen,
 * données ConversationSummary (Worker).
 */
import React, {useEffect} from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  Animated,
  Pressable,
  Text,
} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  memberProfileMetrics as m,
  fontWeight,
} from '../../../shared/theme';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {ContactHero} from '../components/ContactHero';
import {ContactSections} from '../components/ContactSections';
import {
  contactDisplayName,
  contactUsername,
} from '../utils/format';
import {contactsTexts as t} from '../texts';

type Props = {
  conversation: ConversationSummary;
  onBack: () => void;
};

export function ContactProfileScreen({
  conversation,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const reduce = useReducedMotion();
  const insets = useSafeAreaInsets();
  const displayName = contactDisplayName(conversation);
  const username = contactUsername(conversation);

  const fade = React.useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(fade, {
      toValue: 1,
      duration: m.itemRiseMs ?? 280,
      useNativeDriver: true,
    }).start();
  }, [fade, reduce]);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top,
            backgroundColor: colors.bgSecondary,
            borderBottomColor: colors.border,
          },
        ]}>
        <View style={styles.topRow}>
          <Pressable
            onPress={onBack}
            hitSlop={12}
            accessibilityRole="button"
            accessibilityLabel={t.back}
            style={styles.backBtn}>
            <ChevronLeft size={28} color={colors.accent} strokeWidth={2} />
          </Pressable>
          <Text
            numberOfLines={1}
            style={[
              styles.topTitle,
              {color: colors.textPrimary, fontWeight: fontWeight.semibold},
            ]}>
            {t.title}
          </Text>
        </View>
      </View>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{opacity: fade, gap: m.sectionGap}}>
          <ContactHero
            displayName={displayName}
            photoUrl={conversation.photo_url}
            initials={conversation.initials}
            username={username}
            chatType={conversation.chat_type}
          />
          <ContactSections conversation={conversation} />
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  topBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  topRow: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 8,
    paddingRight: 16,
    gap: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topTitle: {
    flex: 1,
    fontSize: 17,
  },
  scroll: {
    paddingHorizontal: m.scrollPadH,
    paddingTop: m.scrollPadTop,
    paddingBottom: m.scrollPadBottom + 24,
  },
});
