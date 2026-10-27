/**
 * En-tête flottant de la conversation : rond ← · pilule (avatar, nom,
 * sous-titre) · rond ⋮. Transparent : les messages défilent derrière.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  getShadow,
  fontWeight,
  radii,
} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';
import {threadTexts as t} from '../texts';
import {RoundButton} from './RoundButton';

type Props = {
  title: string;
  subtitle?: string | null;
  photoUrl?: string | null;
  initials?: string | null;
  offline?: boolean;
  onBack: () => void;
  /** Appui sur la pilule → profil contact. */
  onPressAvatar?: () => void;
  /** Slot droit : bouton ⋮ (ThreadMenu). */
  right?: React.ReactNode;
};

/** Hauteur occupée par l'en-tête flottant (à réserver dans la liste). */
export function useThreadHeaderHeight(offline: boolean): number {
  const insets = useSafeAreaInsets();
  return (
    insets.top +
    tm.floatPadT +
    tm.floatPillHeight +
    tm.floatPadB +
    (offline ? tm.offlineBannerHeight : 0)
  );
}

export function ThreadHeader({
  title,
  subtitle,
  photoUrl,
  initials,
  offline,
  onBack,
  onPressAvatar,
  right,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {paddingTop: insets.top + tm.floatPadT, paddingBottom: tm.floatPadB},
      ]}>
      <View style={styles.row} pointerEvents="box-none">
        <RoundButton label={t.back} onPress={onBack}>
          <ArrowLeft size={22} color={colors.textPrimary} strokeWidth={2} />
        </RoundButton>
        <Pressable
          onPress={onPressAvatar}
          disabled={!onPressAvatar}
          accessibilityRole={onPressAvatar ? 'button' : undefined}
          accessibilityLabel={title}
          style={[
            styles.pill,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Avatar
            photoUrl={photoUrl}
            initials={initials}
            title={title}
            size={tm.avatarSize}
          />
          <View style={styles.texts}>
            <Text
              numberOfLines={1}
              style={{
                color: colors.textPrimary,
                fontSize: tm.titleSize,
                fontWeight: fontWeight.semibold,
              }}>
              {title}
            </Text>
            {subtitle ? (
              <Text
                numberOfLines={1}
                style={{color: colors.textSecondary, fontSize: tm.subtitleSize}}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </Pressable>
        {right}
      </View>
      {offline ? (
        <View
          style={[
            styles.offline,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Text
            numberOfLines={1}
            style={{color: colors.textSecondary, fontSize: tm.subtitleSize}}>
            {t.offlineBanner}
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingHorizontal: tm.floatPadH,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.floatGap,
  },
  pill: {
    flex: 1,
    minWidth: 0,
    height: tm.floatPillHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.headerInfoGap,
    paddingLeft: tm.floatPillPadL,
    paddingRight: tm.floatPillPadR,
    borderRadius: radii.full,
  },
  texts: {flex: 1, minWidth: 0},
  offline: {
    alignSelf: 'center',
    marginTop: tm.floatGap,
    height: tm.offlineBannerHeight - tm.floatGap,
    paddingHorizontal: tm.floatPadH + 4,
    borderRadius: radii.full,
    justifyContent: 'center',
  },
});
