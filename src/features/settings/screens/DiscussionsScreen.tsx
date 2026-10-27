/**
 * Sous-page Discussions — densité, dossiers, swipe, envoi.
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
import {Folder} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
  fontWeight,
} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';
import type {AppearanceSettings} from '../../../shared/theme';

type Props = {
  onBack: () => void;
  onOpenFolders: () => void;
};

export function DiscussionsScreen({
  onBack,
  onOpenFolders,
}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();
  const card = [
    styles.card,
    {backgroundColor: colors.bgPrimary},
    getShadow('sm', mode),
  ];

  const setSwipe = (swipeAction: AppearanceSettings['swipeAction']) => {
    setAppearance({swipeAction});
  };

  return (
    <SettingsShell title={t.discussionsTitle} onBack={onBack}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.blockTitle, {color: colors.accent}]}>
          {t.listDensity}
        </Text>
        <View style={[card, styles.densityRow]}>
          <DensityCard
            label={t.densityTwo}
            active={appearance.listDensity === 'two'}
            lines={2}
            onPress={() => setAppearance({listDensity: 'two'})}
          />
          <DensityCard
            label={t.densityThree}
            active={appearance.listDensity === 'three'}
            lines={3}
            onPress={() => setAppearance({listDensity: 'three'})}
          />
        </View>

        <View style={card}>
          <Pressable
            onPress={onOpenFolders}
            style={({pressed}) => [
              styles.folderRow,
              pressed && {backgroundColor: colors.bgSecondary},
            ]}>
            <Folder size={20} color={colors.accent} />
            <Text style={[styles.folderLabel, {color: colors.textPrimary}]}>
              {t.folders}
            </Text>
            <Text style={{color: colors.textHint}}>{'>'}</Text>
          </Pressable>
        </View>

        <Text style={[styles.blockTitle, {color: colors.accent}]}>
          {t.swipeSection}
        </Text>
        <View style={card}>
          {(
            [
              ['archive', t.swipeArchive],
              ['folder', t.swipeFolder],
              ['pin', t.swipePin],
            ] as const
          ).map(([id, label]) => {
            const active = appearance.swipeAction === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSwipe(id)}
                style={styles.swipeOption}>
                <Text
                  style={[
                    active ? styles.swipeTextActive : styles.swipeTextIdle,
                    {
                      color: active ? colors.textPrimary : colors.textHint,
                      fontWeight: active ? fontWeight.bold : fontWeight.medium,
                    },
                  ]}>
                  {label}
                </Text>
                {active ? (
                  <View style={[styles.swipeBar, {backgroundColor: colors.accent}]} />
                ) : null}
              </Pressable>
            );
          })}
          <Text style={[styles.hint, {color: colors.textSecondary}]}>
            {t.swipeHint}
          </Text>
        </View>

        <Text style={[styles.blockTitle, {color: colors.accent}]}>
          {t.sendSection}
        </Text>
        <View style={[card, styles.switchRow]}>
          <View style={styles.switchLabels}>
            <Text style={[styles.fieldLabel, {color: colors.textPrimary}]}>
              {t.sendWithEnter}
            </Text>
            <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
              {t.sendWithEnterSub}
            </Text>
          </View>
          <Switch
            value={appearance.sendWithEnter}
            onValueChange={v => setAppearance({sendWithEnter: v})}
            trackColor={{false: colors.bgTertiary, true: colors.accent}}
          />
        </View>
      </ScrollView>
    </SettingsShell>
  );
}

function DensityCard({
  label,
  active,
  lines,
  onPress,
}: {
  label: string;
  active: boolean;
  lines: number;
  onPress: () => void;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.densityCard,
        {
          borderColor: active ? colors.accent : colors.borderSoft,
          backgroundColor: colors.bgSecondary,
        },
      ]}>
      <View style={styles.densityPreview}>
        {Array.from({length: lines}).map((_, i) => (
          <View key={i} style={styles.densityLineRow}>
            <View style={[styles.dot, {backgroundColor: colors.textHint}]} />
            <View style={styles.lines}>
              <View style={[styles.line, {backgroundColor: colors.textHint}]} />
              <View
                style={[
                  styles.line,
                  styles.lineShort,
                  {backgroundColor: colors.textHint},
                ]}
              />
            </View>
          </View>
        ))}
      </View>
      <Text style={{color: colors.textPrimary, fontWeight: fontWeight.semibold}}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingHorizontal: sm.cardMarginH,
    paddingTop: 12,
    paddingBottom: 40,
    gap: 10,
  },
  blockTitle: {fontSize: 15, fontWeight: '700', marginTop: 6},
  card: {
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
    padding: 14,
  },
  densityRow: {flexDirection: 'row', gap: 12, padding: 12},
  densityCard: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 2,
    padding: 12,
    gap: 10,
    alignItems: 'center',
  },
  densityPreview: {gap: 8, width: '100%'},
  densityLineRow: {flexDirection: 'row', gap: 8, alignItems: 'center'},
  dot: {width: 18, height: 18, borderRadius: 9, opacity: 0.5},
  lines: {flex: 1, gap: 4},
  line: {height: 6, borderRadius: 3, opacity: 0.45},
  lineShort: {width: '60%'},
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  folderLabel: {flex: 1, fontSize: 16, fontWeight: '600'},
  swipeTextActive: {fontSize: 18},
  swipeTextIdle: {fontSize: 15},
  switchLabels: {flex: 1, gap: 4},
  swipeOption: {alignItems: 'center', paddingVertical: 8, gap: 4},
  swipeBar: {height: 3, width: 48, borderRadius: 2},
  hint: {fontSize: sm.subSize, marginTop: 8, textAlign: 'center'},
  fieldLabel: {fontSize: 15, fontWeight: '600'},
  switchRow: {flexDirection: 'row', alignItems: 'center', gap: 12},
});
