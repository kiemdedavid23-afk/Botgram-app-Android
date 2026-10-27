/**
 * Héros profil bot — BotProfile.css .bp-hero
 * Actions (copier / partager / supprimer la photo), photo + badge appareil photo,
 * statut de connexion, barre de complétion.
 */
import React, {useState} from 'react';
import {View, Text, Alert, StyleSheet} from 'react-native';
import {pick, types, isErrorWithCode, errorCodes} from '@react-native-documents/picker';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme, botProfileMetrics as m, gradients} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import type {BotStatus} from '../../../core/api/endpoints/bots';
import type {BotProfile} from '../../../core/api/endpoints/botProfile.types';
import {DEFAULT_LANG} from '../../../core/api/endpoints/botProfile.types';
import {ConfirmDialog} from '../../gestion';
import {completeness} from '../utils/completeness';
import {botLink} from '../utils/botLink';
import {doDeletePhoto, doUploadPhoto} from '../store/photoActions';
import {texts} from '../texts';
import {HeroActions} from './HeroActions';
import {HeroPhoto} from './HeroPhoto';
import {HeroStatus} from './HeroStatus';
import {HeroCompletion} from './HeroCompletion';

type Props = {profile: BotProfile; status?: BotStatus};

export function BotHero({profile, status}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const [version, setVersion] = useState(0);
  const [gone, setGone] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const name =
    profile.texts[DEFAULT_LANG]?.name || profile.info.username || 'Bot';
  const initial = name.trim().charAt(0).toUpperCase() || '?';
  const {pct, missing} = completeness(profile);
  const grad = mode === 'dark' ? gradients.brandHeroAlt : gradients.brandHero;
  const link = botLink(profile.info.username);

  const fail = (message: string) => Alert.alert(texts.photoErrorTitle, message);

  const changePhoto = async () => {
    if (busy) return;
    try {
      const [file] = await pick({type: [types.images], allowMultiSelection: false});
      if (!file) return;
      setBusy(true);
      const res = await doUploadPhoto(profile.bot_id, {
        uri: file.uri,
        name: file.name ?? 'photo.jpg',
        mime: file.type ?? 'image/jpeg',
        size: typeof file.size === 'number' ? file.size : 0,
      });
      if (res.ok) {
        setGone(false);
        setVersion(v => v + 1);
      } else {
        fail(res.message);
      }
    } catch (e) {
      if (!(isErrorWithCode(e) && e.code === errorCodes.OPERATION_CANCELED)) {
        fail(texts.errorGeneric);
      }
    } finally {
      setBusy(false);
    }
  };

  const confirmDeletePhoto = async () => {
    setBusy(true);
    const res = await doDeletePhoto(profile.bot_id);
    setBusy(false);
    setConfirmDelete(false);
    if (res.ok) setGone(true);
    else fail(res.message);
  };

  return (
    <GradientView colors={[...grad.colors]} angle={grad.angle} style={styles.hero}>
      <View pointerEvents="none" style={styles.deco} />
      <HeroActions
        link={link}
        canDeletePhoto={profile.hasPhoto && !gone}
        onDeletePhoto={() => setConfirmDelete(true)}
      />
      <HeroPhoto
        botId={profile.bot_id}
        initial={initial}
        version={version}
        gone={gone}
        busy={busy}
        onChangePhoto={() => {
          changePhoto().catch(() => undefined);
        }}
      />
      <Text style={[styles.name, {color: colors.heroText}]} numberOfLines={1}>
        {name}
      </Text>
      {profile.info.username ? (
        <Text style={[styles.user, {color: colors.heroText}]}>
          @{profile.info.username}
        </Text>
      ) : null}
      <HeroStatus status={status} />
      <HeroCompletion pct={pct} missing={missing} />
      <ConfirmDialog
        visible={confirmDelete}
        title={texts.photoDeleteTitle}
        body={texts.photoDeleteBody}
        confirmLabel={texts.photoDeleteConfirm}
        danger
        busy={busy}
        onCancel={() => setConfirmDelete(false)}
        onConfirm={() => {
          confirmDeletePhoto().catch(() => undefined);
        }}
      />
    </GradientView>
  );
}

const styles = StyleSheet.create({
  hero: {
    minHeight: m.heroMinHeight,
    borderRadius: m.heroRadius,
    padding: m.heroPad,
    alignItems: 'center',
    gap: m.heroGap,
    overflow: 'hidden',
  },
  deco: {
    position: 'absolute',
    top: h.decoTop,
    right: h.decoRight,
    width: h.decoSize,
    height: h.decoSize,
    borderRadius: h.decoSize / 2,
    backgroundColor: h.decoColor,
  },
  name: {fontSize: m.heroNameSize, fontWeight: m.heroNameWeight},
  user: {fontSize: m.heroUserSize, opacity: m.heroUserOpacity},
});
