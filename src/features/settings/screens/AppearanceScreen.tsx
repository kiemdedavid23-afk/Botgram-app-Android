/**
 * Sous-page Apparence — mise en page de référence (Paramètres des échanges) :
 * taille du texte + aperçu, thème de couleur, coins, vue de la liste, glissement.
 * Chaque réglage est réellement appliqué (fil de messages, liste des échanges).
 */
import React, {useRef, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  Pressable,
  Switch,
  Alert,
  StyleSheet,
  type LayoutChangeEvent,
} from 'react-native';
import {Image as ImageIcon, Palette, Moon, Sun, Smartphone, Zap, RotateCcw} from 'lucide-react-native';
import {HeaderMenu, type HeaderMenuItem} from '../../../shared/components/HeaderMenu';
import {
  useTheme,
  nameColors,
  defaultAppearance as d,
  fontWeight,
} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';
import {SettingsCard, CardTitle, LinkRow} from '../components/ui';
import {SettingsSlider} from '../components/SettingsSlider';
import {ChatPreview, withAlpha} from '../components/ChatPreview';
import {ThemeCarousel} from '../components/ThemeCarousel';
import {ListViewPicker} from '../components/ListViewPicker';
import {SwipePicker} from '../components/SwipePicker';

type Props = {onBack: () => void};

const FONT_MIN = 12;
const FONT_MAX = 24;
const RADIUS_MIN = 8;
const RADIUS_MAX = 28;

const MENU: ReadonlyArray<HeaderMenuItem<'reset'>> = [
  {id: 'reset', label: t.reset, Icon: RotateCcw},
];

export function AppearanceScreen({onBack}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance, toggleTheme} = useTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [themeY, setThemeY] = useState(0);
  const [nameOpen, setNameOpen] = useState(false);
  const night = mode === 'dark';

  const resetAll = () => {
    Alert.alert(t.resetConfirmTitle, t.resetConfirmBody, [
      {text: t.cancel, style: 'cancel'},
      {
        text: t.reset,
        style: 'destructive',
        onPress: () =>
          setAppearance({
            fontSize: d.fontSize,
            cornerRadius: d.cornerRadius,
            listDensity: d.listDensity,
            swipeAction: d.swipeAction,
            wallpaper: d.wallpaper,
            nameColor: d.nameColor,
            followSystemTheme: d.followSystemTheme,
            theme: d.theme,
            limitAnimations: d.limitAnimations,
          }),
      },
    ]);
  };

  const goToThemes = () =>
    scrollRef.current?.scrollTo({y: Math.max(0, themeY - 8), animated: true});

  const onThemeLayout = (e: LayoutChangeEvent) => setThemeY(e.nativeEvent.layout.y);

  return (
    <SettingsPage
      title={t.appearanceTitle}
      onBack={onBack}
      right={<HeaderMenu items={MENU} onSelect={resetAll} />}>
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <SettingsCard>
          <CardTitle>{t.textSizeCard}</CardTitle>
          <SliderLine
            label={t.fontSize}
            value={appearance.fontSize}
            min={FONT_MIN}
            max={FONT_MAX}
            onChange={v => setAppearance({fontSize: v})}
          />
          <ChatPreview />
          <LinkRow Icon={ImageIcon} label={t.changeWallpaper} onPress={goToThemes} />
          <LinkRow
            Icon={Palette}
            label={t.changeNameColor}
            last={!nameOpen}
            onPress={() => setNameOpen(o => !o)}
            trailing={
              <View
                style={[
                  styles.chip,
                  {backgroundColor: withAlpha(appearance.nameColor, 0.14)},
                ]}>
                <Text style={[styles.chipText, {color: appearance.nameColor}]}>
                  {t.previewInName}
                </Text>
              </View>
            }
          />
          {nameOpen ? (
            <View style={styles.dots}>
              {nameColors.map(c => {
                const active = appearance.nameColor === c;
                return (
                  <Pressable
                    key={c}
                    accessibilityRole="button"
                    accessibilityState={{selected: active}}
                    accessibilityLabel={c}
                    onPress={() => setAppearance({nameColor: c})}
                    style={[
                      styles.dotRing,
                      {borderColor: active ? colors.accent : 'transparent'},
                    ]}>
                    <View style={[styles.dot, {backgroundColor: c}]} />
                  </Pressable>
                );
              })}
            </View>
          ) : null}
        </SettingsCard>

        <View onLayout={onThemeLayout}>
          <SettingsCard>
            <CardTitle>{t.colorTheme}</CardTitle>
            <ThemeCarousel />
            <LinkRow
              Icon={night ? Sun : Moon}
              label={night ? t.switchToDay : t.switchToNight}
              onPress={toggleTheme}
            />
            <LinkRow
              Icon={Smartphone}
              label={t.autoTheme}
              last
              trailing={
                <Switch
                  value={appearance.followSystemTheme}
                  onValueChange={v =>
                    setAppearance(
                      v ? {followSystemTheme: true} : {followSystemTheme: false, theme: mode},
                    )
                  }
                  trackColor={{false: colors.bgTertiary, true: colors.accent}}
                />
              }
            />
          </SettingsCard>
        </View>

        <SettingsCard>
          <CardTitle>{t.cornersCard}</CardTitle>
          <SliderLine
            label={t.bubbleRadius}
            value={appearance.cornerRadius}
            min={RADIUS_MIN}
            max={RADIUS_MAX}
            onChange={v => setAppearance({cornerRadius: v})}
          />
        </SettingsCard>

        <ListViewPicker />
        <SwipePicker />

        <SettingsCard>
          <LinkRow
            Icon={Zap}
            label={t.limitAnimations}
            last
            trailing={
              <Switch
                value={appearance.limitAnimations}
                onValueChange={v => setAppearance({limitAnimations: v})}
                trackColor={{false: colors.bgTertiary, true: colors.accent}}
              />
            }
          />
        </SettingsCard>
        <Text style={[styles.hint, {color: colors.textSecondary}]}>
          {t.limitAnimationsSub}
        </Text>
      </ScrollView>
    </SettingsPage>
  );
}

function SliderLine({
  label,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (v: number) => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.sliderLine}>
      <SettingsSlider
        value={value}
        min={min}
        max={max}
        onChange={onChange}
        accessibilityLabel={label}
      />
      <Text style={[styles.value, {color: colors.accent}]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {paddingTop: 12, paddingBottom: 24, gap: 12},
  sliderLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 14,
    paddingRight: 20,
    paddingBottom: 10,
  },
  value: {width: 34, fontSize: 20, textAlign: 'right'},
  chip: {borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6},
  chipText: {fontSize: 16, fontWeight: fontWeight.semibold},
  dots: {
    flexDirection: 'row',
    gap: 6,
    paddingLeft: 62,
    paddingRight: 16,
    paddingBottom: 12,
  },
  dotRing: {borderWidth: 2.5, borderRadius: 22, padding: 2},
  dot: {width: 30, height: 30, borderRadius: 15},
  hint: {fontSize: 13, paddingHorizontal: 32, marginTop: -4},
});
