/**
 * Heros profil bot - BotProfile.css .bp-hero
 * GradientView (shared). Photo via buildBotPhotoSource + onLoad/onError -> store.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Image, StyleSheet} from 'react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme, botProfileMetrics as m, gradients} from '../../../shared/theme';
import {buildBotPhotoSource} from '../../../core/api/endpoints/botProfile';
import {completeness} from '../utils/completeness';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {texts} from '../texts';
import {useBotProfileStore} from '../store/botProfileStore';

type Props = {profile: BotProfile};

export function BotHero({profile}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const setPhotoPresent = useBotProfileStore(s => s.setPhotoPresent);
  const [photo, setPhoto] = useState<{
    uri: string;
    headers: Record<string, string>;
  } | null>(null);
  const name =
    profile.texts[DEFAULT_LANG]?.name ||
    profile.info.username ||
    'Bot';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const {pct, missing} = completeness(profile);
  const grad =
    mode === 'dark' ? gradients.brandHeroAlt : gradients.brandHero;
  const complete = missing.length === 0;

  useEffect(() => {
    let cancelled = false;
    buildBotPhotoSource(profile.bot_id)
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
  }, [profile.bot_id, setPhotoPresent]);

  return (
    <GradientView
      colors={[...grad.colors]}
      angle={grad.angle}
      style={styles.hero}>
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
      <Text style={[styles.name, {color: colors.heroText}]} numberOfLines={1}>
        {name}
      </Text>
      {profile.info.username ? (
        <Text style={[styles.user, {color: colors.heroText}]}>
          @{profile.info.username}
        </Text>
      ) : null}
      <View style={[styles.complete, {backgroundColor: colors.heroChipBg}]}>
        <Text style={[styles.completeText, {color: colors.heroText}]}>
          {complete
            ? texts.completeFull
            : `${pct} % — ${texts.completeness}`}
        </Text>
      </View>
      {!complete ? (
        <Text style={[styles.missing, {color: colors.heroText}]}>
          {texts.missingPrefix} {missing.join(', ')}.
        </Text>
      ) : null}
    </GradientView>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: m.heroMinHeight,
    borderRadius: m.heroRadius,
    padding: m.heroPad,
    alignItems: 'center',
    gap: 10,
    overflow: 'hidden',
  },
  avatar: {
    width: m.heroAvatar,
    height: m.heroAvatar,
    borderRadius: m.heroAvatar / 2,
    overflow: 'hidden',
    borderWidth: 3,
  },
  img: {width: '100%', height: '100%'},
  initialBg: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  initial: {fontSize: 40, fontWeight: '700'},
  name: {fontSize: m.heroNameSize, fontWeight: m.heroNameWeight},
  user: {fontSize: 14, opacity: 0.9},
  complete: {
    marginTop: 4,
    paddingVertical: m.chipPadV,
    paddingHorizontal: m.chipPadH,
    borderRadius: m.chipRadius,
  },
  completeText: {fontSize: 12, fontWeight: '600'},
  missing: {fontSize: 11, opacity: 0.9, textAlign: 'center'},
});
