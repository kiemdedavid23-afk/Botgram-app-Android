/**
 * Barre de navigation basse flottante en pilule — espace bot.
 * Onglets : Échanges / Contacts / Paramètres / Profil (avatar bot)
 * Avatar : 24 px, dégradé 145deg #3390ec → #5c6bc0, initiale.
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

export type BotTabId = 'chats' | 'contacts' | 'settings' | 'profile';

type Props = {
  activeTab: BotTabId;
  onTabPress: (id: BotTabId) => void;
  /** Nom du bot actif (placeholder étape 1) */
  botName?: string;
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
            <GradientView
              colors={avatarColors}
              angle={145}
              style={[
                styles.avatar,
                profileActive && {
                  borderWidth: 2,
                  borderColor: colors.accent,
                },
              ]}>
              <Text style={[styles.avatarText, {color: colors.white}]}>{botInitial(botName)}</Text>
            </GradientView>
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
    left: 0,
    right: 0,
    bottom: 0,
    height: space.bottomNavZone,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingHorizontal: space.bottomNavMarginH,
    zIndex: 100,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    maxWidth: space.bottomNavPillMaxWidth,
    height: space.bottomNavPillHeight,
    borderRadius: radii.navPill,
    borderWidth: 1,
    paddingHorizontal: space.bottomNavPillPaddingH,
  },
  item: {
    flex: 1,
    height: space.bottomNavItemHeight,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.navItemActive,
    gap: 2,
  },
  itemPressed: {
    opacity: 0.7,
  },
  iconWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: fontSize.navLabel,
    fontWeight: fontWeight.medium,
    letterSpacing: 0.01 * fontSize.navLabel,
  },
  badge: {
    position: 'absolute',
    top: -6,
    right: -10,
    minWidth: space.badgeMin,
    height: space.badgeMin,
    paddingHorizontal: 4,
    borderRadius: space.badgeRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: fontSize.badge,
    fontWeight: fontWeight.bold,
    lineHeight: fontSize.badge,
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
