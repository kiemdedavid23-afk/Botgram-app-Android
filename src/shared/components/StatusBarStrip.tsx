/**
 * Bandeau derrière la barre d'état (mode bord à bord) + icônes claires.
 * Bleu de marque en thème clair, comme le site ; fond de la barre en thème sombre.
 * À placer tout en haut d'un écran, avant son en-tête.
 * `seamless` : barre fondue dans la page (couleur du fond, icônes sombres en thème clair),
 * comme Telegram — utilisé par l'écran Échanges.
 */
import React from 'react';
import {View, StatusBar} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../theme';
import {statusBarColors} from '../theme/statusBar';

type Props = {
  /** Écrans toujours clairs (connexion) : bleu même si le thème est sombre. */
  forceBlue?: boolean;
  /** Barre fondue dans le fond de la page (pas de bandeau bleu). */
  seamless?: boolean;
};

export function StatusBarStrip({forceBlue = false, seamless = false}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const color = seamless
    ? colors.bgPrimary
    : forceBlue || mode !== 'dark'
      ? statusBarColors.light
      : colors.bgPrimary;
  const barStyle = seamless && mode !== 'dark' ? 'dark-content' : 'light-content';
  return (
    <>
      <StatusBar barStyle={barStyle} />
      <View style={{height: insets.top, backgroundColor: color}} />
    </>
  );
}
