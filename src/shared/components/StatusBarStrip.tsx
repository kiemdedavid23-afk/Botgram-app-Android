/**
 * Bandeau derrière la barre d'état (mode bord à bord) + icônes claires.
 * Bleu de marque en thème clair, comme le site ; fond de la barre en thème sombre.
 * À placer tout en haut d'un écran, avant son en-tête.
 */
import React from 'react';
import {View, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme';
import {statusBarColors} from '../theme/statusBar';

type Props = {
  /** Écrans toujours clairs (connexion) : bleu même si le thème est sombre. */
  forceBlue?: boolean;
};

export function StatusBarStrip({forceBlue = false}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const color =
    forceBlue || mode !== 'dark' ? statusBarColors.light : colors.bgPrimary;
  return (
    <>
      <StatusBar barStyle="light-content" />
      <View style={{height: insets.top, backgroundColor: color}} />
    </>
  );
}
