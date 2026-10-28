import React from 'react';
import {Text, StyleSheet, Linking} from 'react-native';
import {useTheme, fontWeight} from '../../../shared/theme';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {
  parseFormattedText,
  type TextSegment,
} from '../../../core/utils/parseFormattedText';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  text: string | null | undefined;
  parseMode: string | null | undefined;
  color: string;
  /** Taille du texte (réglage Apparence). */
  fontSize?: number;
};

export function FormattedText({text, parseMode, color, fontSize}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const segments = parseFormattedText(text, parseMode);
  return (
    <Text style={fontSize ? {color, fontSize} : {color}}>
      {segments.map((seg, i) => (
        <Segment key={i} seg={seg} color={color} linkColor={colors.accent} />
      ))}
    </Text>
  );
}

function Segment({
  seg,
  color,
  linkColor,
}: {
  seg: TextSegment;
  color: string;
  linkColor: string;
}): React.JSX.Element {
  const style = [
    seg.bold && styles.bold,
    seg.italic && styles.italic,
    seg.underline && styles.underline,
    seg.strike && styles.strike,
    seg.code && styles.code,
    seg.pre && styles.code,
    seg.href ? {color: linkColor} : {color},
  ];
  if (seg.href) {
    return (
      <Text
        style={style}
        onPress={() => {
          fireAndForget(Linking.openURL(seg.href!));
        }}>
        {seg.text}
      </Text>
    );
  }
  return <Text style={style}>{seg.text}</Text>;
}

const styles = StyleSheet.create({
  bold: {fontWeight: fontWeight.bold},
  italic: {fontStyle: 'italic'},
  underline: {textDecorationLine: 'underline'},
  strike: {textDecorationLine: 'line-through'},
  code: {fontFamily: tm.codeFontFamily},
});
