/**
 * Tiroir de pièces jointes (comme Telegram) : onglets Galerie / Fichier (Position et Contact
 * à venir). Une sélection dans la galerie fait apparaître une légende et « Envoyer (n) ».
 * Les fichiers choisis dans l'onglet Fichier rejoignent le message en cours (bandeau « en attente »).
 */
import React, {useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Pressable,
  Keyboard,
  KeyboardAvoidingView,
  PanResponder,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import {
  Image as ImageIcon,
  File as FileIcon,
  MapPin,
  UserRound,
  Send,
  type LucideIcon,
} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  radii,
  fontSize,
  fontWeight,
  getShadow,
} from '../../../shared/theme';
import {fireAndForget} from '../../../core/utils/fireAndForget';
import {MEDIA_CAPTION_MAX, ALBUM_MAX} from '../mediaLimits';
import type {PickedFile} from '../store/sendMediaActions';
import {attachTexts as t} from './texts';
import {GalleryTab} from './GalleryTab';
import {FileTab} from './FileTab';
import {ContactTab} from './ContactTab';
import type {ContactDraft} from '../store/sendActions';
import {pickFiles} from './pickFiles';
import type {CameraPhoto, GalleryAsset} from './nativeAttach';
import type {SelectedItem} from './types';

type TabId = 'gallery' | 'file' | 'location' | 'contact';

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Photos / vidéos choisies dans le tiroir + légende : envoi immédiat. */
  onSend: (files: PickedFile[], caption: string) => void;
  /** Fichiers de l'onglet Fichier : ajoutés au message en cours. */
  onPickFiles: (files: PickedFile[]) => void;
  /** Contact choisi dans l'onglet Contact : envoi immédiat. */
  onSendContact: (contact: ContactDraft) => void;
};

const TABS: ReadonlyArray<{
  id: TabId;
  label: string;
  Icon: LucideIcon;
  enabled: boolean;
}> = [
  {id: 'gallery', label: t.tabGallery, Icon: ImageIcon, enabled: true},
  {id: 'file', label: t.tabFile, Icon: FileIcon, enabled: true},
  {id: 'location', label: t.tabLocation, Icon: MapPin, enabled: false},
  {id: 'contact', label: t.tabContact, Icon: UserRound, enabled: true},
];

const BAR_SPACE = 96;

export function AttachSheet({
  visible,
  onClose,
  onSend,
  onPickFiles,
  onSendContact,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<TabId>('gallery');
  const [selected, setSelected] = useState<SelectedItem[]>([]);
  const [caption, setCaption] = useState('');
  const [notice, setNotice] = useState<string | null>(null);
  const noticeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      Keyboard.dismiss();
    } else {
      setSelected([]);
      setCaption('');
      setTab('gallery');
      setNotice(null);
    }
  }, [visible]);

  useEffect(
    () => () => {
      if (noticeTimer.current) clearTimeout(noticeTimer.current);
    },
    [],
  );

  const showNotice = useCallback((message: string) => {
    setNotice(message);
    if (noticeTimer.current) clearTimeout(noticeTimer.current);
    noticeTimer.current = setTimeout(() => setNotice(null), 2200);
  }, []);

  const onToggle = useCallback(
    (asset: GalleryAsset) => {
      const key = `g:${asset.id}`;
      setSelected(prev => {
        if (prev.some(s => s.key === key)) {
          return prev.filter(s => s.key !== key);
        }
        if (prev.length >= ALBUM_MAX) {
          showNotice(t.maxItems(ALBUM_MAX));
          return prev;
        }
        return [
          ...prev,
          {
            key,
            file: {
              uri: asset.uri,
              name: asset.name || `${asset.type}-${asset.id}`,
              mime: asset.mime,
              size: asset.size,
            },
            previewUri: asset.uri,
            type: asset.type,
          },
        ];
      });
    },
    [showNotice],
  );

  const onCameraPhoto = useCallback(
    (photo: CameraPhoto) => {
      setSelected(prev => {
        if (prev.length >= ALBUM_MAX) {
          showNotice(t.maxItems(ALBUM_MAX));
          return prev;
        }
        return [
          ...prev,
          {
            key: `c:${photo.name}`,
            file: {
              uri: photo.uri,
              name: photo.name,
              mime: photo.mime,
              size: photo.size,
            },
            previewUri: photo.uri,
            type: 'photo',
          },
        ];
      });
    },
    [showNotice],
  );

  const browse = useCallback(
    (mediaOnly: boolean) => {
      fireAndForget(
        pickFiles(mediaOnly).then(files => {
          if (files && files.length > 0) {
            onPickFiles(files);
            onClose();
          }
        }),
      );
    },
    [onPickFiles, onClose],
  );

  const submit = useCallback(() => {
    if (selected.length === 0) return;
    onSend(
      selected.map(s => s.file),
      caption.trim(),
    );
    onClose();
  }, [selected, caption, onSend, onClose]);

  // Tirer la poignée vers le bas ferme le tiroir.
  const pan = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dy) > 4,
        onPanResponderRelease: (_e, g) => {
          if (g.dy > 70) onClose();
        },
      }),
    [onClose],
  );

  const selectedKeys = useMemo(() => selected.map(s => s.key), [selected]);
  const hasSelection = selected.length > 0;
  const captionTooLong = caption.length > MEDIA_CAPTION_MAX;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior="padding">
        <Pressable
          style={[styles.backdrop, {backgroundColor: colors.overlay}]}
          onPress={onClose}
          accessibilityLabel={t.close}
        />
        <View
          style={[
            styles.sheet,
            {height: Math.round(height * 0.72), backgroundColor: colors.bgSecondary},
          ]}>
          <View {...pan.panHandlers} style={styles.handleZone}>
            <View style={[styles.handle, {backgroundColor: colors.border}]} />
          </View>

          <View style={styles.content}>
            {tab === 'gallery' ? (
              <GalleryTab
                active={visible && tab === 'gallery'}
                selectedKeys={selectedKeys}
                onToggle={onToggle}
                onCameraPhoto={onCameraPhoto}
                onFallbackPick={() => browse(true)}
                bottomSpace={BAR_SPACE + insets.bottom}
              />
            ) : tab === 'file' ? (
              <FileTab onBrowse={() => browse(false)} />
            ) : tab === 'contact' ? (
              <ContactTab
                bottomSpace={BAR_SPACE + insets.bottom}
                onSend={c => {
                  onSendContact(c);
                  onClose();
                }}
              />
            ) : null}
          </View>

          {notice ? (
            <View
              style={[
                styles.notice,
                {backgroundColor: colors.bgPrimary, bottom: BAR_SPACE + insets.bottom + 8},
                getShadow('sm', mode),
              ]}>
              <Text style={{color: colors.textPrimary, fontSize: 13}}>{notice}</Text>
            </View>
          ) : null}

          <View
            style={[
              styles.bar,
              {bottom: insets.bottom + 10, backgroundColor: colors.bgPrimary},
              getShadow('md', mode),
            ]}>
            {hasSelection ? (
              <View style={styles.sendRow}>
                <TextInput
                  value={caption}
                  onChangeText={setCaption}
                  placeholder={t.captionPlaceholder}
                  placeholderTextColor={colors.textHint}
                  maxLength={MEDIA_CAPTION_MAX + 1}
                  style={[styles.caption, {color: colors.textPrimary}]}
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.send}
                  onPress={submit}
                  disabled={captionTooLong}
                  style={[
                    styles.sendBtn,
                    {backgroundColor: captionTooLong ? colors.bgTertiary : colors.accent},
                  ]}>
                  <Send size={18} color={colors.white} />
                  <Text style={[styles.sendText, {color: colors.white}]}>
                    {selected.length}
                  </Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.tabs}>
                {TABS.map(x => {
                  const active = x.id === tab;
                  const tint = !x.enabled
                    ? colors.textHint
                    : active
                      ? colors.accent
                      : colors.textPrimary;
                  return (
                    <Pressable
                      key={x.id}
                      accessibilityRole="tab"
                      accessibilityState={{selected: active, disabled: !x.enabled}}
                      disabled={!x.enabled}
                      onPress={() => setTab(x.id)}
                      style={[
                        styles.tab,
                        active && {backgroundColor: colors.accentSoft},
                      ]}>
                      <x.Icon size={24} color={tint} />
                      <Text style={[styles.tabText, {color: tint}]} numberOfLines={1}>
                        {x.enabled ? x.label : t.soon}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1, justifyContent: 'flex-end'},
  backdrop: {position: 'absolute', top: 0, left: 0, right: 0, bottom: 0},
  sheet: {
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    overflow: 'hidden',
  },
  handleZone: {alignItems: 'center', paddingVertical: 10},
  handle: {width: 40, height: 4, borderRadius: 2},
  content: {flex: 1},
  bar: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: radii.navPill,
    padding: 6,
  },
  tabs: {flexDirection: 'row'},
  tab: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
    paddingVertical: 8,
    borderRadius: radii.navItemActive,
  },
  tabText: {fontSize: 12, fontWeight: fontWeight.medium},
  sendRow: {flexDirection: 'row', alignItems: 'center', gap: 8},
  caption: {flex: 1, fontSize: fontSize.message, paddingHorizontal: 14, minHeight: 44},
  sendBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    height: 44,
    borderRadius: 22,
  },
  sendText: {fontSize: fontSize.message, fontWeight: fontWeight.bold},
  notice: {
    position: 'absolute',
    alignSelf: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
  },
});
