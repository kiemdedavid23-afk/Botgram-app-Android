/**
 * Aperçu caméra natif (CameraX). `active` doit être faux tant que la permission CAMERA
 * n'est pas accordée, et il ne doit y avoir qu'un seul aperçu actif à la fois.
 */
import React from 'react';
import {
  requireNativeComponent,
  NativeModules,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type CameraFlash = 'off' | 'on' | 'auto';

type Props = {
  style?: StyleProp<ViewStyle>;
  active: boolean;
  front?: boolean;
  flash?: CameraFlash;
};

// Même méthode que NativeVideoView : composant natif seulement si le module existe
// (absent en tests Jest, iOS).
const hasNative = NativeModules.BotgramCamera != null;
const Native = hasNative ? requireNativeComponent<Props>('BotgramCameraView') : null;

export function CameraPreview(props: Props): React.JSX.Element {
  if (!Native) return <View style={props.style} />;
  return <Native {...props} />;
}
