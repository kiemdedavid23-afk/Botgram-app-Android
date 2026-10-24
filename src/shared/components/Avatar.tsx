/**
 * Avatar — fidèle à Avatar.css / ConversationsPage.css .chat-item__avatar
 * Dégradé gradients.avatar ; initiales si pas de photo.
 */
import React from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {useTheme, gradients, fontWeight} from '../theme';
import {GradientView} from './GradientView';
import {conversationsMetrics as cm} from '../theme/conversationsMetrics';

type Props = {
  size?: number;
  photoUrl?: string | null;
  initials?: string | null;
  title?: string;
};

function initialsFrom(title: string | undefined, initials: string | null | undefined): string {
  if (initials && initials.trim()) return initials.trim().slice(0, 2).toUpperCase();
  if (!title) return '?';
  const parts = title.trim().split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0]![0] ?? ''}${parts[1]![0] ?? ''}`.toUpperCase();
  }
  return title.slice(0, 2).toUpperCase();
}

export function Avatar({
  size = cm.avatarSize,
  photoUrl,
  initials,
  title,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const label = initialsFrom(title, initials ?? null);
  const r = size / 2;

  if (photoUrl) {
    return (
      <Image
        source={{uri: photoUrl}}
        style={{width: size, height: size, borderRadius: r}}
        accessibilityIgnoresInvertColors
      />
    );
  }

  return (
    <View style={[styles.clip, {width: size, height: size, borderRadius: r}]}>
      <GradientView
        colors={[...gradients.avatar.colors]}
        angle={gradients.avatar.angle ?? 145}
        style={StyleSheet.absoluteFill}
      />
      <View style={[styles.center, {width: size, height: size}]}>
        <Text
          style={{
            color: colors.white ?? '#ffffff',
            fontSize: size >= 48 ? cm.avatarFontSize : size * 0.36,
            fontWeight: fontWeight.semibold,
          }}>
          {label}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  clip: {overflow: 'hidden'},
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
