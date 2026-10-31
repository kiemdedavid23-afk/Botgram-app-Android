/**
 * Onglet Position : demande la permission de localisation, lit la position actuelle,
 * affiche les coordonnées puis « Envoyer cette position ».
 */
import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Pressable, ActivityIndicator, Linking, StyleSheet} from 'react-native';
import {MapPin, Send} from 'lucide-react-native';
import {useTheme, radii, fontSize, fontWeight} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {attachTexts as t} from './texts';
import {getCurrentPosition, type DevicePosition} from './nativeAttach';
import {
  checkLocationAccess,
  requestLocationAccess,
  type LocationAccess,
} from './locationPermission';

type Props = {
  active: boolean;
  bottomSpace: number;
  onSend: (pos: DevicePosition) => void;
  onSendLive: (pos: DevicePosition, periodSec: number) => void;
};

type Phase = 'idle' | 'searching' | 'ready' | 'failed';

const DURATIONS: ReadonlyArray<{sec: number; label: string}> = [
  {sec: 900, label: t.liveDur15},
  {sec: 3600, label: t.liveDur60},
  {sec: 28800, label: t.liveDur480},
];

export function LocationTab({
  active,
  bottomSpace,
  onSend,
  onSendLive,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [access, setAccess] = useState<LocationAccess>('unknown');
  const [phase, setPhase] = useState<Phase>('idle');
  const [pos, setPos] = useState<DevicePosition | null>(null);
  const [duration, setDuration] = useState(3600);

  const locate = useCallback(() => {
    setPhase('searching');
    fireAndForget(
      getCurrentPosition()
        .then(p => {
          setPos(p);
          setPhase('ready');
        })
        .catch(() => setPhase('failed')),
    );
  }, []);

  useEffect(() => {
    if (!active) return;
    fireAndForget(
      checkLocationAccess().then(a => {
        setAccess(a);
        if (a === 'granted') locate();
      }),
    );
  }, [active, locate]);

  const allow = useCallback(() => {
    fireAndForget(
      requestLocationAccess().then(a => {
        setAccess(a);
        if (a === 'granted') locate();
      }),
    );
  }, [locate]);

  const needsPermission = access === 'denied' || access === 'blocked';

  return (
    <View style={[styles.wrap, {paddingBottom: bottomSpace}]}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <View style={[styles.circle, {backgroundColor: '#FF3B30'}]}>
          <MapPin size={26} color="#fff" />
        </View>
        {needsPermission ? (
          <>
            <Text style={[styles.title, {color: colors.textPrimary}]}>{t.locAccessTitle}</Text>
            <Text style={[styles.body, {color: colors.textSecondary}]}>{t.locAccessBody}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={access === 'blocked' ? () => fireAndForget(Linking.openSettings()) : allow}
              style={[styles.btn, {backgroundColor: colors.accent}]}>
              <Text style={[styles.btnText, {color: colors.white}]}>
                {access === 'blocked' ? t.locOpenSettings : t.locAllow}
              </Text>
            </Pressable>
          </>
        ) : phase === 'searching' ? (
          <>
            <ActivityIndicator color={colors.accent} />
            <Text style={[styles.body, {color: colors.textSecondary}]}>{t.locSearching}</Text>
          </>
        ) : phase === 'ready' && pos ? (
          <>
            <Text style={[styles.title, {color: colors.textPrimary}]}>
              {pos.latitude.toFixed(5)}, {pos.longitude.toFixed(5)}
            </Text>
            {pos.accuracy > 0 ? (
              <Text style={[styles.body, {color: colors.textSecondary}]}>
                {t.locAccuracy(Math.round(pos.accuracy))}
              </Text>
            ) : null}
            <Pressable
              accessibilityRole="button"
              onPress={() => onSend(pos)}
              style={[styles.btn, {backgroundColor: colors.accent}]}>
              <Send size={16} color={colors.white} />
              <Text style={[styles.btnText, {color: colors.white}]}>{t.locSend}</Text>
            </Pressable>
            <View style={styles.chips}>
              {DURATIONS.map(d => {
                const on = d.sec === duration;
                return (
                  <Pressable
                    key={d.sec}
                    accessibilityRole="button"
                    accessibilityState={{selected: on}}
                    onPress={() => setDuration(d.sec)}
                    style={[
                      styles.chip,
                      {backgroundColor: on ? colors.accentSoft : colors.bgSecondary},
                    ]}>
                    <Text style={{color: on ? colors.accent : colors.textPrimary, fontSize: 13}}>
                      {d.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              accessibilityRole="button"
              onPress={() => onSendLive(pos, duration)}
              style={[styles.btnOutline, {borderColor: colors.accent}]}>
              <Text style={[styles.btnText, {color: colors.accent}]}>{t.locSendLive}</Text>
            </Pressable>
            <Text style={[styles.body, {color: colors.textHint}]}>{t.locLiveHint}</Text>
          </>
        ) : phase === 'failed' ? (
          <>
            <Text style={[styles.body, {color: colors.textSecondary}]}>{t.locFailed}</Text>
            <Pressable
              accessibilityRole="button"
              onPress={locate}
              style={[styles.btn, {backgroundColor: colors.accent}]}>
              <Text style={[styles.btnText, {color: colors.white}]}>{t.locRetry}</Text>
            </Pressable>
          </>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {flex: 1, paddingHorizontal: 12},
  card: {
    borderRadius: radii.navPill,
    padding: 20,
    alignItems: 'center',
    gap: 10,
  },
  circle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {fontSize: fontSize.message, fontWeight: fontWeight.medium, textAlign: 'center'},
  body: {fontSize: 13, textAlign: 'center'},
  btn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    marginTop: 4,
  },
  chips: {flexDirection: 'row', gap: 8, marginTop: 6},
  chip: {paddingHorizontal: 14, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center'},
  btnOutline: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  btnText: {fontSize: fontSize.message, fontWeight: fontWeight.bold},
});
