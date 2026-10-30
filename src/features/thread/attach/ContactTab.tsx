/**
 * Onglet Contact : le sélecteur de contacts du système (aucune permission requise —
 * Android ne partage que le contact choisi). Aperçu de la carte puis « Envoyer ».
 */
import React, {useCallback, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {UserRound, Send} from 'lucide-react-native';
import {useTheme, radii, fontSize, fontWeight} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {attachTexts as t} from './texts';
import {pickContact, type PickedContact} from './nativeAttach';

type Props = {
  bottomSpace: number;
  onSend: (contact: PickedContact) => void;
};

export function ContactTab({bottomSpace, onSend}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [contact, setContact] = useState<PickedContact | null>(null);
  const [error, setError] = useState<string | null>(null);

  const choose = useCallback(() => {
    setError(null);
    fireAndForget(
      pickContact()
        .then(c => {
          if (c) setContact(c);
        })
        .catch(() => setError(t.contactFailed)),
    );
  }, []);

  const fullName = contact
    ? [contact.first_name, contact.last_name].filter(Boolean).join(' ')
    : '';

  return (
    <View style={[styles.wrap, {paddingBottom: bottomSpace}]}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <Pressable
          accessibilityRole="button"
          onPress={choose}
          style={({pressed}) => [
            styles.row,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <View style={[styles.circle, {backgroundColor: '#FF9500'}]}>
            <UserRound size={24} color="#fff" />
          </View>
          <View style={styles.text}>
            <Text style={[styles.title, {color: colors.textPrimary}]}>
              {contact ? t.contactChange : t.contactPick}
            </Text>
            <Text style={[styles.sub, {color: colors.textSecondary}]}>
              {t.contactPickSub}
            </Text>
          </View>
        </Pressable>
      </View>

      {contact ? (
        <View style={[styles.preview, {backgroundColor: colors.bgPrimary}]}>
          <View style={[styles.avatar, {backgroundColor: colors.accentSoft}]}>
            <Text style={[styles.avatarText, {color: colors.accent}]}>
              {fullName.slice(0, 1).toUpperCase()}
            </Text>
          </View>
          <View style={styles.text}>
            <Text
              numberOfLines={1}
              style={[styles.title, {color: colors.textPrimary}]}>
              {fullName}
            </Text>
            <Text style={[styles.sub, {color: colors.textSecondary}]}>
              {contact.phone_number}
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.contactSend}
            onPress={() => onSend(contact)}
            style={[styles.sendBtn, {backgroundColor: colors.accent}]}>
            <Send size={18} color={colors.white} />
          </Pressable>
        </View>
      ) : null}

      {error ? (
        <Text style={[styles.hint, {color: colors.textSecondary}]}>{error}</Text>
      ) : null}
      <Text style={[styles.hint, {color: colors.textHint}]}>{t.contactHint}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, paddingHorizontal: 12, gap: 12},
  card: {borderRadius: radii.navPill, overflow: 'hidden'},
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12},
  circle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flex: 1},
  title: {fontSize: fontSize.message, fontWeight: fontWeight.medium},
  sub: {fontSize: 13, marginTop: 2},
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: radii.navPill,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {fontSize: 18, fontWeight: fontWeight.bold},
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {fontSize: 12, paddingHorizontal: 8},
});
