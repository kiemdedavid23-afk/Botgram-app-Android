/** Position dans une bulle : épingle, coordonnées, « Ouvrir dans Cartes » (intent geo:). */
import React, {useCallback} from 'react';
import {View, Text, Pressable, Linking, StyleSheet} from 'react-native';
import {MapPin} from 'lucide-react-native';
import type {LocationPayload} from '../../../core/realtime/messageTypes';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {useLiveLocationStore, stopLive} from '../live/liveLocation';
import {threadTexts as t} from '../texts';

type Props = {
  /** Id serveur du message (pour arrêter un partage en direct). */
  messageId: string;
  location: LocationPayload;
  textColor: string;
  subColor: string;
};

export function LocationBubble({
  messageId,
  location,
  textColor,
  subColor,
}: Props): React.JSX.Element {
  const {latitude: lat, longitude: lon} = location;
  const ended = useLiveLocationStore(s => s.ended[messageId] === true);
  const mine = useLiveLocationStore(s => s.activeId === messageId);
  const live =
    !ended &&
    location.live_period != null &&
    !location.stopped_at &&
    (location.live_until == null || location.live_until > Date.now());

  const open = useCallback(() => {
    const geo = `geo:${lat},${lon}?q=${lat},${lon}`;
    const web = `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=16/${lat}/${lon}`;
    fireAndForget(Linking.openURL(geo).catch(() => Linking.openURL(web)));
  }, [lat, lon]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={t.locationOpen}
      onPress={open}
      style={styles.row}>
      <View style={styles.pin}>
        <MapPin size={22} color="#fff" />
      </View>
      <View style={styles.text}>
        <Text style={[styles.title, {color: textColor}]}>
          {live ? t.locationLive : t.kindLocation}
        </Text>
        <Text style={[styles.sub, {color: subColor}]}>
          {lat.toFixed(5)}, {lon.toFixed(5)}
        </Text>
        <Text style={[styles.link, {color: textColor}]}>{t.locationOpen}</Text>
        {mine ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => fireAndForget(stopLive(messageId))}>
            <Text style={[styles.stop, {color: textColor}]}>{t.locationStop}</Text>
          </Pressable>
        ) : ended && location.live_period != null ? (
          <Text style={[styles.sub, {color: subColor}]}>{t.locationEnded}</Text>
        ) : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 10, minWidth: 210, paddingVertical: 2},
  pin: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {flexShrink: 1},
  title: {fontSize: 15, fontWeight: '600'},
  sub: {fontSize: 12, marginTop: 1},
  stop: {fontSize: 13, fontWeight: '700', marginTop: 6},
  link: {fontSize: 13, fontWeight: '600', marginTop: 3, textDecorationLine: 'underline'},
});
