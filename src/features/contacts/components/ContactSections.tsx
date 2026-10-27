/**
 * Sections infos profil contact — style ProfileSections membre.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  User,
  AtSign,
  Hash,
  MessagesSquare,
  Fingerprint,
} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {ContactRow} from './ContactRow';
import {contactsTexts as texts} from '../texts';
import {
  contactUsername,
  chatTypeLabel,
} from '../utils/format';

type Props = {
  conversation: ConversationSummary;
};

export function ContactSections({conversation}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const username = contactUsername(conversation);
  const empty = texts.emptyValue;

  const cardStyle = [
    styles.card,
    {
      backgroundColor: colors.bgPrimary,
      borderColor: colors.borderSoft,
    },
    getShadow('sm', mode),
  ];

  const first = conversation.first_name?.trim() || empty;
  const last = conversation.last_name?.trim() || empty;
  const contactId = conversation.contact_id?.trim() || empty;
  const chatType = chatTypeLabel(conversation.chat_type);

  return (
    <View style={styles.section}>
      <Text
        style={[
          styles.sectionTitle,
          styles.sectionTitleSolo,
          {color: colors.textHint},
        ]}>
        {texts.sectionInfo}
      </Text>
      <View style={cardStyle}>
        <ContactRow icon={<User />} label={texts.labelFirstName} value={first} />
        <Divider />
        <ContactRow icon={<User />} label={texts.labelLastName} value={last} />
        <Divider />
        <ContactRow
          icon={<AtSign />}
          label={texts.labelUsername}
          value={username ?? empty}
        />
        <Divider />
        <ContactRow
          icon={<MessagesSquare />}
          label={texts.labelChatType}
          value={chatType}
        />
        <Divider />
        <ContactRow
          icon={<Fingerprint />}
          label={texts.labelContactId}
          value={contactId}
        />
        <Divider />
        <ContactRow
          icon={<Hash />}
          label={texts.labelConversationId}
          value={conversation.id || empty}
        />
      </View>
    </View>
  );
}

function Divider(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.divider, {backgroundColor: colors.bgSecondary}]} />
  );
}

const styles = StyleSheet.create({
  section: {gap: m.sectionInnerGap},
  sectionTitle: {
    fontSize: m.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: m.sectionTitleLetter * m.sectionTitleSize,
    textTransform: 'uppercase',
  },
  sectionTitleSolo: {
    paddingHorizontal: m.sectionHeadPadH,
  },
  card: {
    borderRadius: m.cardRadius,
    borderWidth: 1,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginHorizontal: 16,
  },
});
