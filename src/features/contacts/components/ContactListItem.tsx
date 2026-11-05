import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {contactsMetrics as cmx} from '../../../shared/theme/contactsMetrics';
import type {Contact} from '../../../core/api/endpoints/contacts';
import {contactDisplayName, contactUsername} from '../utils/format';

type Props = {
  contact: Contact;
  onPress: (contact: Contact) => void;
};

export function ContactListItem({contact, onPress}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const name = contactDisplayName(contact);
  const username = contactUsername(contact);
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={name}
      onPress={() => onPress(contact)}
      android_ripple={{color: colors.accentSoft}}
      style={styles.row}>
      <Avatar
        size={cmx.avatarSize}
        photoUrl={contact.photo_url}
        initials={contact.initials}
        title={name}
      />
      <View style={styles.labels}>
        <Text style={[styles.name, {color: colors.textPrimary}]} numberOfLines={1}>
          {name}
        </Text>
        {username && username !== name ? (
          <Text
            style={[styles.user, {color: colors.textSecondary}]}
            numberOfLines={1}>
            {username}
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: cmx.rowGap,
    paddingHorizontal: cmx.rowPadH,
    paddingVertical: cmx.rowPadV,
  },
  labels: {flex: 1},
  name: {fontSize: cmx.nameSize, fontWeight: fontWeight.semibold},
  user: {fontSize: cmx.userSize},
});
