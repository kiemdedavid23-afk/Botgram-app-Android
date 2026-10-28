/**
 * Barre de navigation basse flottante en pilule — espace bot.
 * Onglets : Échanges / Contacts / Paramètres / Profil (avatar bot)
 * Avatar : navAvatarSize, dégradé gradients.avatar, initiale.
 * Badge non-lus prévu mais non branché (étape 1).
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
import {MessagesSquare, CircleUser, Settings} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {GradientView} from './GradientView';
import {BotPhoto} from './BotPhoto';
import {useTheme, getShadow, navPillBorder,
  navMetrics as nm, gradients, fontWeight, fontSize, space, radii} from '../theme';

export type BotTabId = 'chats' | 'contacts' | 'settings' | 'profile';

type Props = {
  activeTab: BotTabId;
  onTabPress: (id: BotTabId) => void;
  /** Nom du bot actif (placeholder étape 1) */
  botName?: string;
  /** Bot actif : sa photo (cache partagé) remplace l'initiale quand elle existe. */
  botId?: string | null;
  /** Nombre de non-lus (non branché) */
  unreadBadge?: number;
  visible?: boolean;
  style?: StyleProp<ViewStyle>;
};

function botInitial(name: string): string {
  const t = name.trim();
  if (t.length === 0) {
    return 'B';
  }
  return t.charAt(0).toUpperCase();
}

export function BotBottomNav({
  activeTab,
  onTabPress,
  botName = 'Bot',
  botId,
  unreadBadge,
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
  const avatarColors = gradients.avatar.colors;

  const renderIconTab = (
    id: BotTabId,
    label: string,
    Icon: typeof MessagesSquare,
    badge?: number,
  ) => {
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
          {badge !== undefined && badge > 0 ? (
            <View style={[styles.badge, {backgroundColor: colors.accent}]}>
              <Text style={[styles.badgeText, {color: colors.white}]}>
                {badge > 99 ? '99+' : String(badge)}
              </Text>
            </View>
          ) : null}
        </View>
        <Text
          style={[
            styles.label,
            {color},
            active && {fontWeight: fontWeight.semibold},
          ]}
          numberOfLines={1}>
          {label}
        </Text>
      </Pressable>
    );
  };

  const avatarActiveBorder = {borderColor: colors.accent} as const;
  const profileActive = activeTab === 'profile';

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
        {renderIconTab('chats', 'Échanges', MessagesSquare, unreadBadge)}
        {renderIconTab('contacts', 'Contacts', CircleUser)}
        {renderIconTab('settings', 'Paramètres', Settings)}
        <Pressable
          accessibilityRole="tab"
          accessibilityState={{selected: profileActive}}
          onPress={() => onTabPress('profile')}
          style={({pressed}) => [
            styles.item,
            profileActive && {backgroundColor: colors.accentSoft},
            pressed && styles.itemPressed,
          ]}>
          <View style={styles.iconWrap}>
            <View style={[styles.avatarOuter, profileActive ? avatarActiveBorder : null]}>
              <BotPhoto
                botId={botId}
                style={styles.avatar}
                fallback={
                  <GradientView colors={avatarColors} angle={145} style={styles.avatar}>
                    <Text style={[styles.avatarText, {color: colors.white}]}>{botInitial(botName)}</Text>
                  </GradientView>
                }
              />
            </View>
          </View>
          <Text
            style={[
              styles.label,
              {
                color: profileActive ? colors.accent : colors.textSecondary,
              },
            ]}
            numberOfLines={1}>
            Profil
          </Text>
        </Pressable>
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
  badge: {
    position: 'absolute',
    top: nm.badgeOffsetTop,
    right: nm.badgeOffsetRight,
    minWidth: space.badgeMin,
    height: space.badgeMin,
    paddingHorizontal: nm.badgePadH,
    borderRadius: space.badgeRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.badge,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.badge,
  },
  avatarOuter: {
    width: nm.avatarOuterSize,
    height: nm.avatarOuterSize,
    margin: nm.avatarOuterMargin,
    borderRadius: nm.avatarOuterSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: nm.avatarRingBorder,
    borderColor: nm.transparent,
  },
  avatar: {
    width: space.navAvatarSize,
    height: space.navAvatarSize,
    borderRadius: space.navAvatarSize / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: fontSize.navAvatarInitial,
    fontWeight: fontWeight.bold,
  },
});
