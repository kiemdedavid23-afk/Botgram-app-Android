/** Carte de contact dans une bulle : avatar à initiale, nom, numéro. */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {UserRound} from 'lucide-react-native';
import type {ContactPayload} from '../../../core/realtime/messageTypes';

type Props = {
  contact: ContactPayload;
  textColor: string;
  subColor: string;
};

export function ContactBubble({contact, textColor, subColor}: Props): React.JSX.Element {
  const name = [contact.first_name, contact.last_name].filter(Boolean).join(' ');
  return (
    <View style={styles.row}>
      <View style={styles.avatar}>
        {name ? (
          <Text style={styles.initial}>{name.slice(0, 1).toUpperCase()}</Text>
        ) : (
          <UserRound size={20} color="#fff" />
        )}
      </View>
      <View style={styles.text}>
        <Text numberOfLines={1} style={[styles.name, {color: textColor}]}>
          {name}
        </Text>
        <Text numberOfLines={1} style={[styles.phone, {color: subColor}]}>
          {contact.phone_number}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 190, paddingVertical: 2},
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF9500',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initial: {color: '#fff', fontSize: 17, fontWeight: '700'},
  text: {flexShrink: 1},
  name: {fontSize: 15, fontWeight: '600'},
  phone: {fontSize: 13, marginTop: 1},
});
