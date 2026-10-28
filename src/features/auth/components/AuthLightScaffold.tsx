/**
 * Squelette commun des écrans de connexion clairs (Code, Profil) :
 *  - fond blanc et bandeau bleu d'origine ;
 *  - contenu CENTRÉ verticalement dans l'espace libre ;
 *  - clavier : KeyboardAvoidingView 'padding' (basé sur le chevauchement réel, donc sans
 *    double décalage si Android a déjà redimensionné la fenêtre) + ScrollView si l'écran est court ;
 *  - flèche retour et indicateur d'étape (1 e-mail, 2 code, 3 profil).
 */
import React from 'react';
import {View, Pressable, ScrollView, StyleSheet, KeyboardAvoidingView} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {authColors, authMetrics, authUi} from '../../../shared/theme/authColors';
import {shellMetrics as sm} from '../../../shared/theme/shellMetrics';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';

type Props = {step: 1 | 2 | 3; onBack: () => void; children: React.ReactNode};

export function AuthLightScaffold({step, onBack, children}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={styles.root}>
      <StatusBarStrip forceBlue />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={styles.top}>
          <Pressable
            onPress={onBack}
            hitSlop={sm.authBackHitSlop}
            style={styles.back}
            accessibilityRole="button"
            accessibilityLabel="Retour">
            <ArrowLeft size={sm.authBackIconSize} color={authColors.text} />
          </Pressable>
          <View
            style={styles.dots}
            accessible
            accessibilityLabel={`Étape ${step} sur 3`}>
            {[1, 2, 3].map(i => (
              <View
                key={i}
                style={[styles.dot, i <= step ? styles.dotOn : null, i === step ? styles.dotCurrent : null]}
              />
            ))}
          </View>
          <View style={styles.back} />
        </View>
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, {paddingBottom: insets.bottom + 24}]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}>
          <View style={styles.center}>{children}</View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: authColors.bg},
  flex: {flex: 1},
  top: {
    height: authMetrics.headHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sm.authPadH,
  },
  back: {
    width: sm.backBtnSize,
    height: sm.backBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dots: {flex: 1, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 6},
  dot: {width: 8, height: 8, borderRadius: 4, backgroundColor: authUi.dotOff},
  dotOn: {backgroundColor: authColors.accent},
  dotCurrent: {width: 24},
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: authMetrics.bodyPaddingH,
    paddingTop: 8,
  },
  center: {width: '100%', alignItems: 'stretch'},
});
