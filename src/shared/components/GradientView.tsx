/**
 * Composant de dégradé réutilisable basé sur react-native-svg.
 * Angle CSS : 0° = vers le haut, 90° = vers la droite, 180° = vers le bas.
 * Formule centrée : x1 = 50 - 50·sinθ, y1 = 50 + 50·cosθ, x2 = 50 + 50·sinθ, y2 = 50 - 50·cosθ.
 * Le SVG reçoit des dimensions explicites (et une clé) dès que la taille est
 * mesurée : sinon il peut rester peint à une ancienne taille après un relayout.
 * Pour rectangles non carrés : onLayout + gradientUnits="userSpaceOnUse" + L = |w·sinθ| + |h·cosθ|.
 */
import React, {useId, useState} from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle, type LayoutChangeEvent} from 'react-native';
import Svg, {Defs, LinearGradient, Rect, Stop} from 'react-native-svg';

type Props = {
  colors: string[];
  /** Angle CSS en degrés (0 = vers le haut) */
  angle?: number;
  style?: StyleProp<ViewStyle>;
  children?: React.ReactNode;
};

/** Points en pourcentage, centrés sur le milieu. */
export function angleToPoints(angle: number): {x1: number; y1: number; x2: number; y2: number} {
  const rad = (angle * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);
  return {
    x1: 50 - 50 * sin,
    y1: 50 + 50 * cos,
    x2: 50 + 50 * sin,
    y2: 50 - 50 * cos,
  };
}

export function GradientView({
  colors,
  angle = 180,
  style,
  children,
}: Props): React.JSX.Element {
  const id = useId().replace(/:/g, '');
  const [size, setSize] = useState<{w: number; h: number} | null>(null);

  const onLayout = (e: LayoutChangeEvent) => {
    const {width, height} = e.nativeEvent.layout;
    if (width > 0 && height > 0) {
      setSize({w: width, h: height});
    }
  };

  const rad = (angle * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);

  let gradientProps: {
    x1: string | number;
    y1: string | number;
    x2: string | number;
    y2: string | number;
    gradientUnits?: 'userSpaceOnUse' | 'objectBoundingBox';
  };

  if (size) {
    const L = Math.abs(size.w * sin) + Math.abs(size.h * cos);
    const cx = size.w / 2;
    const cy = size.h / 2;
    const dx = (L / 2) * sin;
    const dy = -(L / 2) * cos;
    gradientProps = {
      x1: cx - dx,
      y1: cy - dy,
      x2: cx + dx,
      y2: cy + dy,
      gradientUnits: 'userSpaceOnUse',
    };
  } else {
    const p = angleToPoints(angle);
    gradientProps = {
      x1: `${p.x1}%`,
      y1: `${p.y1}%`,
      x2: `${p.x2}%`,
      y2: `${p.y2}%`,
    };
  }

  return (
    <View style={[styles.root, style]} onLayout={onLayout}>
      <Svg
        key={size ? `${size.w}x${size.h}` : 'init'}
        width={size ? size.w : '100%'}
        height={size ? size.h : '100%'}
        style={StyleSheet.absoluteFill}>
        <Defs>
          <LinearGradient id={id} {...gradientProps}>
            {colors.map((c, i) => (
              <Stop
                key={i}
                offset={`${(i / Math.max(1, colors.length - 1)) * 100}%`}
                stopColor={c}
              />
            ))}
          </LinearGradient>
        </Defs>
        <Rect
          width={size ? size.w : '100%'}
          height={size ? size.h : '100%'}
          fill={`url(#${id})`}
        />
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
