/**
 * Composant de dégradé réutilisable basé sur react-native-svg.
 * Utilisé pour avatar, fonds d'écran, marque.
 */
import React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

type Props = {
  colors: string[];
  /** Angle CSS en degrés (0 = bas vers haut, 90 = gauche vers droite) */
  angle?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

function angleToPoints(angle: number): {x1: string; y1: string; x2: string; y2: string} {
  // Approximation simple pour les angles courants (145, 135, 160, 180)
  const rad = ((angle - 90) * Math.PI) / 180;
  const x2 = 50 + Math.cos(rad) * 50;
  const y2 = 50 + Math.sin(rad) * 50;
  return {
    x1: '0%',
    y1: '0%',
    x2: `${Math.max(0, Math.min(100, x2))}%`,
    y2: `${Math.max(0, Math.min(100, y2))}%`,
  };
}

export function GradientView({
  colors,
  angle = 180,
  style,
  children,
}: Props): React.JSX.Element {
  const {x1, y1, x2, y2} = angleToPoints(angle);
  const id = `grad-${colors.join('-').replace(/[^a-z0-9]/gi, '')}`;

  return (
    <View style={[styles.root, style]}>
      <Svg width="100%" height="100%" style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} x1={x1} y1={y1} x2={x2} y2={y2}>
            {colors.map((c, i) => (
              <Stop
                key={i}
                offset={`${(i / Math.max(1, colors.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    overflow: 'hidden',
  },
});
