/**
 * Rangée de boutons arrondis sous le cadre du profil contact :
 * Message (retour à la discussion) et Épingler / Désépingler.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {MessageCircle, Pin, PinOff} from 'lucide-react-native';
import {
  useTheme,
  radii,
  fontSize,
  fontWeight,
  getShadow,
} from '../../../shared/theme';
import {contactsTexts as t} from '../texts';

type Props = {
  pinned: boolean;
  /** Épingler passe par le serveur : grisé hors ligne. */
  pinDisabled?: boolean;
  onMessage: () => void;
  onTogglePin: () => void;
};

type ButtonProps = {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
};

function ActionButton({
  label,
  icon,
  onPress,
  disabled,
}: ButtonProps): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({pressed}) => [
        styles.btn,
        {backgroundColor: colors.bgPrimary},
        getShadow('sm', mode),
        pressed && {backgroundColor: colors.bgTertiary},
        disabled && styles.disabled,
      ]}>
      {icon}
      <Text style={[styles.label, {color: colors.textPrimary}]}>{label}</Text>
    </Pressable>
  );
}

export function ContactActions({
  pinned,
  pinDisabled,
  onMessage,
  onTogglePin,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const PinIcon = pinned ? PinOff : Pin;
  return (
    <View style={styles.row}>
      <ActionButton
        label={t.actionMessage}
        icon={<MessageCircle size={24} color={colors.textPrimary} />}
        onPress={onMessage}
      />
      <ActionButton
        label={pinned ? t.actionUnpin : t.actionPin}
        icon={<PinIcon size={24} color={colors.textPrimary} />}
        onPress={onTogglePin}
        disabled={pinDisabled}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', gap: 10},
  btn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 14,
    borderRadius: radii.lg,
  },
  label: {fontSize: fontSize.listSubtitle + 1, fontWeight: fontWeight.medium},
  disabled: {opacity: 0.45},
});
