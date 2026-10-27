/**
 * Avatar du héros : photo du bot (ou initiale) + badge appareil photo.
 * La photo est chargée avec l'en-tête Authorization ; `version` force le rechargement.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, Pressable, ActivityIndicator, StyleSheet} from 'react-native';
import {Camera} from 'lucide-react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import {buildBotPhotoSource} from '../../../core/api/endpoints/botProfile';
import {useBotProfileStore} from '../store/botProfileStore';
import {texts} from '../texts';

type Props = {
  botId: string;
  initial: string;
  version: number;
  gone: boolean;
  busy: boolean;
  onChangePhoto: () => void;
};

export function HeroPhoto({
  botId,
  initial,
  version,
  gone,
  busy,
  onChangePhoto,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const setPhotoPresent = useBotProfileStore(s => s.setPhotoPresent);
  const [photo, setPhoto] = useState<{
    uri: string;
    headers: Record<string, string>;
  } | null>(null);

  useEffect(() => {
    if (gone) {
      setPhoto(null);
      return undefined;
    }
    let cancelled = false;
    buildBotPhotoSource(botId, version)
      .then(src => {
        if (!cancelled) setPhoto(src);
      })
      .catch(() => {
        if (!cancelled) {
          setPhoto(null);
          setPhotoPresent(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [botId, version, gone, setPhotoPresent]);

  return (
    <View style={styles.wrap}>
      <View style={[styles.avatar, {borderColor: colors.heroChipBorder}]}>
        {photo ? (
          <Image
            source={photo}
            style={styles.img}
            onLoad={() => setPhotoPresent(true)}
            onError={() => {
              setPhoto(null);
              setPhotoPresent(false);
            }}
          />
        ) : (
          <View style={[styles.img, styles.initialBg]}>
            <Text style={[styles.initial, {color: colors.heroText}]}>
              {initial}
            </Text>
          </View>
        )}
      </View>
      <Pressable
        onPress={onChangePhoto}
        disabled={busy}
        style={[styles.camera, {backgroundColor: colors.white}]}
        accessibilityRole="button"
        accessibilityLabel={texts.actionChangePhoto}>
        {busy ? (
          <ActivityIndicator size="small" color={colors.accent} />
        ) : (
          <Camera size={h.cameraIcon} color={colors.accent} />
        )}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {width: m.heroAvatar, height: m.heroAvatar},
  avatar: {
    width: m.heroAvatar,
    height: m.heroAvatar,
    borderRadius: m.heroAvatar / 2,
    overflow: 'hidden',
    borderWidth: m.heroAvatarBorder,
  },
  img: {width: '100%', height: '100%'},
  initialBg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  initial: {fontSize: m.heroInitialSize, fontWeight: m.heroInitialWeight},
  camera: {
    position: 'absolute',
    right: h.cameraOffset,
    bottom: h.cameraOffset,
    width: h.cameraSize,
    height: h.cameraSize,
    borderRadius: h.cameraSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
