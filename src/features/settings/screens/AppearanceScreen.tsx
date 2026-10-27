/**
 * Sous-page Apparence — thème, wallpaper, messages, animations.
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Pressable,
  Switch,
} from 'react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {GradientView} from '../../../shared/components/GradientView';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
  nameColors,
  wallpapers,
  type WallpaperId,
  fontWeight,
} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';

type Props = {onBack: () => void};

const FONT_MIN = 12;
const FONT_MAX = 20;
const RADIUS_MIN = 8;
const RADIUS_MAX = 28;

export function AppearanceScreen({onBack}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();
  const wp = wallpapers[appearance.wallpaper];
  const card = [
    styles.card,
    {backgroundColor: colors.bgPrimary},
    getShadow('sm', mode),
  ];

  const setThemeMode = (choice: 'light' | 'dark' | 'auto') => {
    if (choice === 'auto') {
      setAppearance({followSystemTheme: true});
    } else {
      setAppearance({followSystemTheme: false, theme: choice});
    }
  };

  const themeChoice = appearance.followSystemTheme
    ? 'auto'
    : appearance.theme;

  const bumpFont = (delta: number) => {
    const next = Math.min(FONT_MAX, Math.max(FONT_MIN, appearance.fontSize + delta));
    setAppearance({fontSize: next});
  };

  const bumpRadius = (delta: number) => {
    const next = Math.min(
      RADIUS_MAX,
      Math.max(RADIUS_MIN, appearance.cornerRadius + delta),
    );
    setAppearance({cornerRadius: next});
  };

  return (
    <SettingsShell title={t.appearanceTitle} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.blockTitle, {color: colors.accent}]}>{t.preview}</Text>
        <View style={card}>
          <GradientView
            colors={[...wp.colors]}
            angle={145}
            style={styles.previewBox}>
            <View
              style={[
                styles.bubbleIn,
                {borderRadius: appearance.cornerRadius},
              ]}>
              <Text
                style={{
                  color: appearance.nameColor,
                  fontWeight: fontWeight.semibold,
                  fontSize: appearance.fontSize - 1,
                }}>
                {t.previewInName}
              </Text>
              <Text
                style={[styles.previewText, {fontSize: appearance.fontSize}]}>
                {t.previewInText}
              </Text>
            </View>
            <View
              style={[
                styles.bubbleOut,
                {borderRadius: appearance.cornerRadius},
              ]}>
              <Text
                style={[styles.previewText, {fontSize: appearance.fontSize}]}>
                {t.previewOutText}
              </Text>
            </View>
          </GradientView>
        </View>

        <Text style={[styles.blockTitle, {color: colors.accent}]}>{t.theme}</Text>
        <View style={[card, styles.segment]}>
          {(
            [
              ['light', t.themeLight],
              ['dark', t.themeDark],
              ['auto', t.themeAuto],
            ] as const
          ).map(([id, label]) => {
            const active = themeChoice === id;
            return (
              <Pressable
                key={id}
                onPress={() => setThemeMode(id)}
                style={[
                  styles.segItem,
                  active && {
                    backgroundColor: colors.bgPrimary,
                    borderColor: colors.borderSoft,
                  },
                ]}>
                <Text
                  style={{
                    color: active ? colors.accent : colors.textSecondary,
                    fontWeight: active ? fontWeight.semibold : fontWeight.medium,
                  }}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.blockTitle, {color: colors.accent}]}>
          {t.wallpaper}
        </Text>
        <View style={[card, styles.wpRow]}>
          {(Object.keys(wallpapers) as WallpaperId[]).map(id => {
            const w = wallpapers[id];
            const active = appearance.wallpaper === id;
            return (
              <Pressable
                key={id}
                onPress={() => setAppearance({wallpaper: id})}
                style={[
                  styles.wpItem,
                  active && {borderColor: colors.accent},
                ]}>
                <GradientView
                  colors={[...w.colors]}
                  angle={160}
                  style={styles.wpGrad}>
                  <Text style={styles.wpEmoji}>{w.emoji}</Text>
                </GradientView>
              </Pressable>
            );
          })}
        </View>

        <Text style={[styles.blockTitle, {color: colors.accent}]}>
          {t.messages}
        </Text>
        <View style={card}>
          <SliderRow
            label={t.fontSize}
            value={appearance.fontSize}
            onMinus={() => bumpFont(-1)}
            onPlus={() => bumpFont(1)}
          />
          <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
          <SliderRow
            label={t.bubbleRadius}
            value={appearance.cornerRadius}
            onMinus={() => bumpRadius(-1)}
            onPlus={() => bumpRadius(1)}
          />
          <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
          <Text style={[styles.fieldLabel, {color: colors.textPrimary}]}>
            {t.nameColor}
          </Text>
          <View style={styles.colorRow}>
            {nameColors.map(c => {
              const active = appearance.nameColor === c;
              return (
                <Pressable
                  key={c}
                  onPress={() => setAppearance({nameColor: c})}
                  style={[
                    styles.colorDot,
                    {backgroundColor: c},
                    active && [
                      styles.colorDotActive,
                      {borderColor: colors.accent},
                    ],
                  ]}
                />
              );
            })}
          </View>
        </View>

        <View style={[card, styles.switchRow]}>
          <View style={styles.switchLabels}>
            <Text style={[styles.fieldLabel, {color: colors.textPrimary}]}>
              {t.limitAnimations}
            </Text>
            <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
              {t.limitAnimationsSub}
            </Text>
          </View>
          <Switch
            value={appearance.limitAnimations}
            onValueChange={v => setAppearance({limitAnimations: v})}
            trackColor={{false: colors.bgTertiary, true: colors.accent}}
          />
        </View>
      </ScrollView>
    </SettingsShell>
  );
}

function SliderRow({
  label,
  value,
  onMinus,
  onPlus,
}: {
  label: string;
  value: number;
  onMinus: () => void;
  onPlus: () => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={styles.sliderBlock}>
      <View style={styles.sliderHead}>
        <Text style={[styles.fieldLabel, {color: colors.textPrimary}]}>
          {label}
        </Text>
        <Text style={{color: colors.textSecondary, fontWeight: fontWeight.semibold}}>
          {value}
        </Text>
      </View>
      <View style={styles.sliderControls}>
        <Pressable onPress={onMinus} style={[styles.stepBtn, {backgroundColor: colors.bgSecondary}]}>
          <Text style={[styles.stepLabel, {color: colors.textPrimary}]}>−</Text>
        </Pressable>
        <View style={[styles.track, {backgroundColor: colors.bgTertiary}]}>
          <View
            style={[
              styles.trackFill,
              {
                backgroundColor: colors.accent,
                width: `${Math.min(100, Math.max(8, ((value - 8) / 20) * 100))}%`,
              },
            ]}
          />
        </View>
        <Pressable onPress={onPlus} style={[styles.stepBtn, {backgroundColor: colors.bgSecondary}]}>
          <Text style={[styles.stepLabel, {color: colors.textPrimary}]}>+</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: sm.cardMarginH,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  blockTitle: {
    fontSize: 15,
    fontWeight: '700',
    marginTop: 6,
  },
  card: {
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
    padding: 14,
  },
  previewBox: {
    borderRadius: 14,
    padding: 14,
    gap: 10,
    minHeight: 120,
  },
  bubbleIn: {
    alignSelf: 'flex-start',
    padding: 10,
    maxWidth: '85%',
    gap: 2,
    backgroundColor: 'rgba(255,255,255,0.92)',
  },
  bubbleOut: {
    alignSelf: 'flex-end',
    padding: 10,
    maxWidth: '85%',
    backgroundColor: 'rgba(200,255,200,0.95)',
  },
  previewText: {color: '#222'},
  colorDotActive: {borderWidth: 3},
  stepLabel: {fontSize: 18},
  segment: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    padding: 4,
    gap: 4,
  },
  segItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  wpRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  wpItem: {
    width: 72,
    height: 96,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  wpGrad: {flex: 1, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 10},
  wpEmoji: {fontSize: 22},
  fieldLabel: {fontSize: 15, fontWeight: '600'},
  sep: {height: 1, marginVertical: 12},
  colorRow: {flexDirection: 'row', gap: 12, marginTop: 10},
  colorDot: {width: 32, height: 32, borderRadius: 16},
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  switchLabels: {flex: 1, gap: 4},
  sliderBlock: {gap: 8},
  sliderHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sliderControls: {flexDirection: 'row', alignItems: 'center', gap: 8},
  stepBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  track: {flex: 1, height: 6, borderRadius: 3, overflow: 'hidden'},
  trackFill: {height: '100%', borderRadius: 3},
});
