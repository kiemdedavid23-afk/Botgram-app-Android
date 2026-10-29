/**
 * Avatar du héros : photo du bot (cache partagé 2 jours) ou initiale + badge appareil photo.
 */
import React, {useEffect} from 'react';
import {View, Text, Pressable, ActivityIndicator, StyleSheet} from 'react-native';
import {Camera} from 'lucide-react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import {BotPhoto} from '../../../shared/components/BotPhoto';
import {useBotPhotoStore} from '../../../shared/botPhoto/botPhotoStore';
import {openImageViewer} from '../../../core/media/imageViewer';
import {useBotProfileStore} from '../store/botProfileStore';
import {texts} from '../texts';

type Props = {
  botId: string;
  initial: string;
  busy: boolean;
  onChangePhoto: () => void;
};

export function HeroPhoto({
  botId,
  initial,
  busy,
  onChangePhoto,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const setPhotoPresent = useBotProfileStore(s => s.setPhotoPresent);
  const known = useBotPhotoStore(s => s.photos[botId]?.known ?? false);
  const photoUri = useBotPhotoStore(s => s.photos[botId]?.uri ?? null);
  const hasUri = photoUri !== null;

  // Le profil (complétude, bouton « supprimer la photo ») suit l'état réel de la photo.
  useEffect(() => {
    if (known) setPhotoPresent(hasUri);
  }, [known, hasUri, setPhotoPresent]);

  return (
    <View style={styles.wrap}>
      <Pressable
        disabled={!photoUri}
        onPress={() => {
          if (photoUri) openImageViewer([{uri: photoUri}], 0);
        }}
        style={[styles.avatar, {borderColor: colors.heroChipBorder}]}>
        <BotPhoto
          botId={botId}
          style={styles.img}
          fallback={
            <View style={[styles.img, styles.initialBg]}>
              <Text style={[styles.initial, {color: colors.heroText}]}>
                {initial}
              </Text>
            </View>
          }
        />
      </Pressable>
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
