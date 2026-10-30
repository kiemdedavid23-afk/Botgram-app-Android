/**
 * Caméra plein écran : aperçu en direct, déclencheur, flash, changement de caméra.
 * La photo prise est remise à l'appelant (elle rejoint la sélection du tiroir).
 */
import React, {useState} from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import {X, Zap, ZapOff, SwitchCamera} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {CameraPreview, type CameraFlash} from './CameraPreview';
import {takeCameraPhoto, type CameraPhoto} from './nativeAttach';
import {attachTexts as t} from './texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  visible: boolean;
  onClose: () => void;
  onCaptured: (photo: CameraPhoto) => void;
};

const NEXT_FLASH: Record<CameraFlash, CameraFlash> = {
  off: 'auto',
  auto: 'on',
  on: 'off',
};

export function CameraCapture({
  visible,
  onClose,
  onCaptured,
}: Props): React.JSX.Element {
  const insets = useSafeAreaInsets();
  const [front, setFront] = useState(false);
  const [flash, setFlash] = useState<CameraFlash>('off');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const shoot = () => {
    if (busy) return;
    setBusy(true);
    setError(null);
    fireAndForget(
      takeCameraPhoto()
        .then(photo => {
          if (photo) onCaptured(photo);
          else setError(t.cameraFailed);
        })
        .finally(() => setBusy(false)),
    );
  };

  const FlashIcon = flash === 'off' ? ZapOff : Zap;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={styles.root}>
        <CameraPreview
          style={StyleSheet.absoluteFill}
          active={visible}
          front={front}
          flash={front ? 'off' : flash}
        />

        <View style={[styles.top, {paddingTop: insets.top + 12}]}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.cameraClose}
            onPress={onClose}
            style={styles.round}>
            <X size={24} color="#fff" />
          </Pressable>
          {!front ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.cameraFlash}
              onPress={() => setFlash(f => NEXT_FLASH[f])}
              style={styles.round}>
              <FlashIcon size={22} color="#fff" />
              {flash === 'auto' ? <Text style={styles.auto}>A</Text> : null}
            </Pressable>
          ) : (
            <View style={styles.round} />
          )}
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <View style={[styles.bottom, {paddingBottom: insets.bottom + 24}]}>
          <View style={styles.side} />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.cameraShutter}
            onPress={shoot}
            style={styles.shutterRing}>
            {busy ? (
              <ActivityIndicator color="#000" />
            ) : (
              <View style={styles.shutter} />
            )}
          </Pressable>
          <View style={styles.side}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.cameraFlip}
              onPress={() => setFront(f => !f)}
              style={styles.round}>
              <SwitchCamera size={24} color="#fff" />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, backgroundColor: '#000'},
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  round: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  auto: {
    position: 'absolute',
    right: 9,
    bottom: 7,
    color: '#fff',
    fontSize: 10,
    fontWeight: '700',
  },
  error: {
    position: 'absolute',
    top: '45%',
    alignSelf: 'center',
    color: '#fff',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  bottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 28,
  },
  side: {width: 56, alignItems: 'flex-end'},
  shutterRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 4,
    borderColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutter: {
    width: 62,
    height: 62,
    borderRadius: 31,
    backgroundColor: '#fff',
  },
});
