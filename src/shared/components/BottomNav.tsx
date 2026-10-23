/**
 * Barre de navigation basse flottante en pilule — espace membre.
 * Onglets : Tableau de bord / Profil / Paramètres
 * CSS de référence : BottomNav.css + 02-DESIGN-TOKENS.md
 * Repli flou : fond navBg semi-opaque (V-G).
 */
import React from 'react';
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import {LayoutDashboard, UserRound, Settings} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {
  useTheme,
  space,
  radii,
  fontSize,
  fontWeight,
  getShadow,
  navPillBorder,
  navMetrics as nm,
} from '../theme';

export type MemberTabId = 'dashboard' | 'member' | 'settings';

type TabDef = {
  id: MemberTabId;
  label: string;
  Icon: typeof LayoutDashboard;
};

const TABS: TabDef[] = [
  {id: 'dashboard', label: 'Tableau de bord', Icon: LayoutDashboard},
  {id: 'member', label: 'Profil', Icon: UserRound},
  {id: 'settings', label: 'Paramètres', Icon: Settings},
];

type Props = {
  activeTab: MemberTabId;
  onTabPress: (id: MemberTabId) => void;
  /** Masquer la barre (ex. conversation ouverte) */
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BottomNav({
  activeTab,
  onTabPress,
  visible = true,
  style,
}: Props): React.JSX.Element | null {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();

  if (!visible) {
    return null;
  }

  const pillShadow = getShadow('navPill', mode);
  const borderColor = navPillBorder[mode];

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.zone,
        {
          height: space.bottomNavZone + insets.bottom,
          paddingBottom: space.bottomNavMarginBottom + insets.bottom,
        },
        style,
      ]}>
      <View
        style={[
          styles.pill,
          {
            backgroundColor: colors.navBg,
            borderColor,
            ...pillShadow,
          },
        ]}>
        {TABS.map(({id, label, Icon}) => {
          const active = activeTab === id;
          const color = active ? colors.accent : colors.textSecondary;
          return (
            <Pressable
              key={id}
              accessibilityRole="tab"
              accessibilityState={{selected: active}}
              onPress={() => onTabPress(id)}
              style={({pressed}) => [
                styles.item,
                active && {backgroundColor: colors.accentSoft},
                pressed && styles.itemPressed,
              ]}>
              <View style={styles.iconWrap}>
                <Icon size={22} strokeWidth={1.8} color={color} />
              </View>
              <Text
                style={[
                  styles.label,
                  {color},
                ]}
                numberOfLines={1}>
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  zone: {
    position: 'absolute',
    left: nm.edge,
    right: nm.edge,
    bottom: nm.edge,
    height: space.bottomNavZone,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: space.bottomNavMarginH,
    zIndex: nm.zIndex,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: space.bottomNavPillMaxWidth,
    height: space.bottomNavPillHeight,
    borderRadius: radii.navPill,
    borderWidth: nm.borderWidth,
    paddingHorizontal: space.bottomNavPillPaddingH,
  },
  item: {
    flex: 1,
    height: space.bottomNavItemHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.navItemActive,
    gap: nm.itemGap,
  },
  itemPressed: {
    opacity: nm.itemPressedOpacity,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.navLabel,
    fontWeight: fontWeight.medium,
    letterSpacing: nm.labelLetterSpacingFactor * fontSize.navLabel,
  },
});
