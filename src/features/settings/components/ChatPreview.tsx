/**
 * Aperçu du fil : fond d'écran, bulle reçue avec citation, bulle envoyée.
 * Reflète exactement taille du texte, arrondi, couleur du nom et fond réglés.
 */
import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {CheckCheck} from 'lucide-react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {useTheme, useChatTheme, fontWeight} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';

/** '#rrggbb' → 'rgba(r,g,b,a)'. */
export function withAlpha(hex: string, alpha: number): string {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m) {
    return hex;
  }
  const h = m[1] ?? '000000';
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export function ChatPreview(): React.JSX.Element {
  const {appearance} = useTheme();
  const chat = useChatTheme();
  const radius = appearance.cornerRadius;
  const size = appearance.fontSize;
  const name = appearance.nameColor;

  return (
    <GradientView colors={[...chat.wallpaperColors]} angle={160} style={styles.box}>
      {chat.dim ? <View pointerEvents="none" style={styles.dim} /> : null}
      <View
        style={[
          styles.bubble,
          styles.bubbleIn,
          {backgroundColor: chat.bubbleIn, borderRadius: radius},
        ]}>
        <View
          style={[
            styles.quote,
            {borderLeftColor: name, backgroundColor: withAlpha(name, 0.12)},
          ]}>
          <Text
            style={{color: name, fontSize: size, fontWeight: fontWeight.semibold}}>
            {t.previewInName}
          </Text>
          <Text style={{color: chat.bubbleInText, fontSize: size}}>
            {t.previewQuoteText}
          </Text>
        </View>
        <View style={styles.bodyRow}>
          <Text style={[styles.shrink, {color: chat.bubbleInText, fontSize: size}]}>
            {t.previewBody}
          </Text>
          <Text style={[styles.time, {color: chat.timeIn}]}>10:55</Text>
        </View>
      </View>
      <View
        style={[
          styles.bubble,
          styles.bubbleOut,
          {backgroundColor: chat.bubbleOut, borderRadius: radius},
        ]}>
        <Text style={[styles.shrink, {color: chat.bubbleOutText, fontSize: size}]}>
          {t.previewOut}
        </Text>
        <Text style={[styles.time, {color: chat.timeOut}]}>11:10</Text>
        <CheckCheck size={16} color={chat.timeOut} />
      </View>
    </GradientView>
  );
}

const styles = StyleSheet.create({
  box: {paddingHorizontal: 12, paddingVertical: 14, gap: 8},
  dim: {...StyleSheet.absoluteFill, backgroundColor: 'rgba(0,0,0,0.45)'},
  bubble: {paddingHorizontal: 12, paddingVertical: 8, maxWidth: '86%'},
  bubbleIn: {alignSelf: 'flex-start', gap: 6},
  bubbleOut: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  quote: {
    borderLeftWidth: 3,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  bodyRow: {flexDirection: 'row', alignItems: 'flex-end', gap: 8},
  time: {fontSize: 11, marginBottom: 1},
  shrink: {flexShrink: 1},
});
