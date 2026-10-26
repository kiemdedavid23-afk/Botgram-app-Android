/**
 * Bouton avatar de l'en-tête (photo ou initiales + chevron).
 * Ouvre la feuille de bascule membre / bots.
 */
import React from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {ChevronDown, ChevronUp} from 'lucide-react-native';
import {Avatar} from './Avatar';
import {useTheme, space, radii} from '../theme';

type Props = {
  /** Nom affiché → initiales si pas de photo. */
  title: string;
  photoUrl?: string | null;
  /** Feuille ouverte → chevron vers le haut. */
  open: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
};

const AVATAR_SIZE = 32;

export function HeaderAvatarButton({
  title,
  photoUrl,
  open,
  onPress,
  accessibilityLabel = 'Changer de compte ou de bot',
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{expanded: open}}
      onPress={onPress}
      hitSlop={space.sm}
      style={styles.root}>
      <Avatar size={AVATAR_SIZE} title={title} photoUrl={photoUrl} />
      <Chevron size={18} color={colors.textSecondary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  root: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
    paddingHorizontal: space.xs,
    paddingVertical: space.xs,
    borderRadius: radii.full,
  },
});
