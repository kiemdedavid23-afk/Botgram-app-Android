/**
 * Fond photo des écrans de connexion (identité Botsgram) : dégradé bleu nuit,
 * arcs lumineux et bulles de messagerie, dans l'esprit de l'affiche.
 * L'image est derrière tout le contenu et n'est jamais redimensionnée par le clavier :
 * placer KeyboardAvoidingView À L'INTÉRIEUR de ce composant, jamais autour.
 */
import React from 'react';
import {View, Image, StatusBar, StyleSheet} from 'react-native';
import {welcomeColors} from '../../../shared/theme/authColors';

const bgImage = require('../../../assets/auth_bg.webp');

type Props = {children: React.ReactNode};

export function AuthBackground({children}: Props): React.JSX.Element {
  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <Image
        source={bgImage}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
        accessible={false}
      />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: welcomeColors.bg},
});
