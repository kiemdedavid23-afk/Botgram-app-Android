/**
 * « Geste de glissement » : aperçu de la rangée + sélecteur vertical à trois valeurs
 * (la valeur choisie reste au centre, encadrée de deux traits bleus).
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Archive, Folder, Pin, type LucideIcon} from 'lucide-react-native';
import {useTheme, type AppearanceSettings} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import {SettingsCard, CardTitle} from './ui';

type Swipe = AppearanceSettings['swipeAction'];

const ORDER: Swipe[] = ['archive', 'folder', 'pin'];
const LABEL: Record<Swipe, string> = {
  archive: t.swipeArchive,
  folder: t.swipeFolderLabel,
  pin: t.swipePin,
};
const ICON: Record<Swipe, LucideIcon> = {archive: Archive, folder: Folder, pin: Pin};
const ZONE: Record<Swipe, string> = {
  archive: '#8E9AA7',
  folder: '#2AABEE',
  pin: '#E67E22',
};

export function SwipePicker(): React.JSX.Element {
  const {colors, appearance, setAppearance} = useTheme();
  const current = appearance.swipeAction;
  const idx = ORDER.indexOf(current);
  const prev = ORDER[(idx + ORDER.length - 1) % ORDER.length] ?? current;
  const next = ORDER[(idx + 1) % ORDER.length] ?? current;
  const Icon = ICON[current];

  return (
    <SettingsCard>
      <CardTitle>{t.swipeCard}</CardTitle>
      <View style={styles.row}>
        <View style={[styles.preview, {backgroundColor: ZONE[current]}]}>
          <View style={[styles.slide, {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft}]}>
            <View style={[styles.avatar, {backgroundColor: colors.bgTertiary}]} />
            <View style={[styles.line, {backgroundColor: colors.bgTertiary}]} />
          </View>
          <View style={styles.zone}>
            <Icon size={22} color="#ffffff" />
          </View>
        </View>
        <View style={styles.wheel}>
          <Choice label={LABEL[prev]} onPress={() => setAppearance({swipeAction: prev})} />
          <View style={[styles.selected, {borderColor: colors.accent}]}>
            <Text style={[styles.selectedText, {color: colors.textPrimary}]}>
              {LABEL[current]}
            </Text>
          </View>
          <Choice label={LABEL[next]} onPress={() => setAppearance({swipeAction: next})} />
        </View>
      </View>
      <Text style={[styles.hint, {color: colors.textSecondary}]}>{t.swipeHint}</Text>
    </SettingsCard>
  );
}

function Choice({label, onPress}: {label: string; onPress: () => void}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.choice}>
      <Text style={[styles.choiceText, {color: colors.textHint}]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 16, paddingHorizontal: 20, paddingVertical: 8},
  preview: {flex: 1, height: 56, borderRadius: 12, overflow: 'hidden', flexDirection: 'row'},
  slide: {
    flex: 1,
    marginRight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingLeft: 8,
    borderWidth: 1,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
  },
  avatar: {width: 24, height: 24, borderRadius: 12},
  line: {width: 36, height: 5, borderRadius: 3},
  zone: {position: 'absolute', right: 0, top: 0, bottom: 0, width: 52, alignItems: 'center', justifyContent: 'center'},
  wheel: {flex: 1},
  choice: {height: 34, alignItems: 'center', justifyContent: 'center'},
  choiceText: {fontSize: 16},
  selected: {height: 40, borderTopWidth: 2, borderBottomWidth: 2, alignItems: 'center', justifyContent: 'center'},
  selectedText: {fontSize: 17},
  hint: {fontSize: 14, paddingHorizontal: 20, paddingTop: 6, paddingBottom: 16},
});
