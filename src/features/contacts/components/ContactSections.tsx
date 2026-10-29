/**
 * Carte d'informations du profil contact : la valeur en grand,
 * son libellé en gris juste dessous (comme dans Telegram).
 * Les champs vides ne sont pas affichés.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import type {ConversationSummary} from '../../../core/api/endpoints/conversations';
import {contactsTexts as texts} from '../texts';
import {contactUsername, chatTypeLabel} from '../utils/format';

type Props = {
  conversation: ConversationSummary;
};

type Field = {key: string; label: string; value: string};

export function ContactSections({conversation}: Props): React.JSX.Element | null {
  const {colors, mode} = useTheme();

  const fullName = [conversation.first_name, conversation.last_name]
    .map(p => p?.trim())
    .filter(Boolean)
    .join(' ');
  const username = contactUsername(conversation);
  const contactId = conversation.contact_id?.trim();

  const fields: Field[] = [
    {key: 'name', label: texts.labelFullName, value: fullName},
    {key: 'username', label: texts.labelUsername, value: username ?? ''},
    {
      key: 'type',
      label: texts.labelChatType,
      value: chatTypeLabel(conversation.chat_type),
    },
    {key: 'contact', label: texts.labelContactId, value: contactId ?? ''},
    {
      key: 'conv',
      label: texts.labelConversationId,
      value: conversation.id ?? '',
    },
  ].filter(f => f.value.length > 0);

  if (fields.length === 0) return null;

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft},
        getShadow('sm', mode),
      ]}>
      {fields.map(f => (
        <View key={f.key} style={styles.field}>
          <Text selectable style={[styles.value, {color: colors.textPrimary}]}>
            {f.value}
          </Text>
          <Text style={[styles.label, {color: colors.textSecondary}]}>
            {f.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: m.cardRadius,
    borderWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  field: {paddingVertical: 10, gap: 3},
  value: {fontSize: 17, fontWeight: '500'},
  label: {fontSize: 14},
});
