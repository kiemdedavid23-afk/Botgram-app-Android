/**
 * Actions du héros : copier le lien Telegram, le partager, supprimer la photo.
 * Les boutons sans objet (pas de pseudo, pas de photo) ne sont pas affichés.
 */
import React, {useEffect, useRef, useState} from 'react';
import {View, Pressable, Share, StyleSheet} from 'react-native';
import Clipboard from '@react-native-clipboard/clipboard';
import {Copy, Check, Share2, Trash2} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {texts} from '../texts';

type Props = {
  link: string | null;
  canDeletePhoto: boolean;
  onDeletePhoto: () => void;
};

export function HeroActions({
  link,
  canDeletePhoto,
  onDeletePhoto,
}: Props): React.JSX.Element | null {
  const {colors} = useTheme();
  const [copied, setCopied] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  if (!link && !canDeletePhoto) return null;

  const copy = () => {
    if (!link) return;
    Clipboard.setString(link);
    setCopied(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopied(false), 1500);
  };

  const share = () => {
    if (!link) return;
    fireAndForget(
      Share.share({message: link}).then(
        () => undefined,
        () => undefined,
      ),
    );
  };

  const btn = [styles.btn, {backgroundColor: colors.heroChipBg}];
  return (
    <View style={styles.col}>
      {link ? (
        <>
          <Pressable
            onPress={copy}
            style={btn}
            accessibilityRole="button"
            accessibilityLabel={copied ? texts.linkCopied : texts.actionCopy}>
            {copied ? (
              <Check size={h.actionIcon} color={colors.heroText} />
            ) : (
              <Copy size={h.actionIcon} color={colors.heroText} />
            )}
          </Pressable>
          <Pressable
            onPress={share}
            style={btn}
            accessibilityRole="button"
            accessibilityLabel={texts.actionShare}>
            <Share2 size={h.actionIcon} color={colors.heroText} />
          </Pressable>
        </>
      ) : null}
      {canDeletePhoto ? (
        <Pressable
          onPress={onDeletePhoto}
          style={btn}
          accessibilityRole="button"
          accessibilityLabel={texts.actionDeletePhoto}>
          <Trash2 size={h.actionIcon} color={colors.heroText} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  col: {
    position: 'absolute',
    top: h.actionsTop,
    right: h.actionsRight,
    gap: h.actionGap,
    zIndex: 2,
  },
  btn: {
    width: h.actionSize,
    height: h.actionSize,
    borderRadius: h.actionRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
