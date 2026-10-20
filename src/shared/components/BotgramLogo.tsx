/**
 * Logo Botgram — conversion de public/favicon.svg (site) en react-native-svg.
 * Aucun fichier image binaire.
 */
import React from 'react';
import Svg, {Defs, LinearGradient, Rect, Path, Circle, G, Stop} from 'react-native-svg';

type Props = {size?: number};

export function BotgramLogo({size = 128}: Props): React.JSX.Element {
  return (
    <Svg width={size} height={size} viewBox="0 0 1024 1024">
      <Defs>
        <LinearGradient id="bg" x1="1" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#0aa6c8" />
          <Stop offset="1" stopColor="#06314f" />
        </LinearGradient>
        <LinearGradient id="jet" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#e8f6ff" />
          <Stop offset="1" stopColor="#7cc4ff" />
        </LinearGradient>
      </Defs>
      <Rect width="1024" height="1024" rx="230" fill="url(#bg)" />
      <G transform="translate(582 442) rotate(45) scale(0.88)">
        <Path d="M70 335 L215 395 L205 442 L58 425 Z" fill="#5aa9f0" stroke="#e8f6ff" strokeWidth={10} />
        <Path d="M-70 335 L-215 395 L-205 442 L-58 425 Z" fill="#5aa9f0" stroke="#e8f6ff" strokeWidth={10} />
        <Path
          d="M0 -450 L350 250 L356 315 L130 270 L90 330 L60 400 L0 360 L-60 400 L-90 330 L-130 270 L-356 315 L-350 250 Z"
          fill="url(#jet)"
          stroke="#e8f6ff"
          strokeWidth={16}
        />
        <Path d="M0 -370 C44 -300 46 -230 30 -170 L-30 -170 C-46 -230 -44 -300 0 -370 Z" fill="#06395e" />
      </G>
      <G transform="translate(512 512) scale(0.8)">
        <G fill="#06395e">
          <Circle cx="0" cy="-168" r="24" />
          <Rect x="-8" y="-150" width="16" height="48" />
          <Rect x="-128" y="-110" width="256" height="170" rx="78" />
          <Rect x="-160" y="-52" width="50" height="76" rx="25" />
          <Rect x="110" y="-52" width="50" height="76" rx="25" />
        </G>
        <Circle cx="-52" cy="-24" r="34" fill="#e8f6ff" />
        <Circle cx="52" cy="-24" r="34" fill="#e8f6ff" />
      </G>
    </Svg>
  );
}
