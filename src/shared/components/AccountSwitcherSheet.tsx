/**
 * Feuille de bascule membre / bots (ouverte par la photo de l'en-tête).
 * Une coche marque le contexte actif ; un point vert signale un bot connecté.
 */
import React from 'react';
import {
  Modal,
  View,
  Text,
  Pressable,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {Bot, Check} from 'lucide-react-native';
import {BotPhoto} from './BotPhoto';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {Avatar} from './Avatar';
import {
  useTheme,
  getShadow,
  fontSize,
  fontWeight,
  space,
  radii,
} from '../theme';

export type SwitcherBot = {
  id: string;
  name: string;
  connected: boolean;
};

type Props = {
  visible: boolean;
  onClose: () => void;
  /** Contexte courant : espace membre ou espace d'un bot. */
  context: 'member' | 'bot';
  memberName: string;
  memberEmail: string;
  memberPhotoUrl?: string | null;
  bots: ReadonlyArray<SwitcherBot>;
  /** Bot dont l'espace est ouvert (coché quand context === 'bot'). */
  activeBotId: string | null;
  onSelectMember: () => void;
  onSelectBot: (id: string) => void;
};

const t = {
  botsSection: 'MES BOTS',
  connected: 'Connecté',
  notConnected: 'Non connecté',
  close: 'Fermer',
} as const;

const ROW_AVATAR = 46;
const BOTS_MAX_HEIGHT = 280;

function CheckBadge(): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.badge, {backgroundColor: colors.accent}]}>
      <Check size={18} color={colors.white ?? '#ffffff'} />
    </View>
  );
}

export function AccountSwitcherSheet({
  visible,
  onClose,
  context,
  memberName,
  memberEmail,
  memberPhotoUrl,
  bots,
  activeBotId,
  onSelectMember,
  onSelectBot,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();
  const memberActive = context === 'member';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}>
      <View style={[styles.overlay, {backgroundColor: colors.overlay}]}>
        <Pressable
          accessibilityLabel={t.close}
          style={StyleSheet.absoluteFill}
          onPress={onClose}
        />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: colors.bgPrimary,
              paddingBottom: insets.bottom + space.md,
            },
            getShadow('md', mode),
          ]}>
          <View style={[styles.handle, {backgroundColor: colors.border}]} />

          <Pressable
            accessibilityRole="button"
            accessibilityState={{selected: memberActive}}
            onPress={onSelectMember}
            style={[
              styles.row,
              memberActive && {backgroundColor: colors.accentSoft},
            ]}>
            <Avatar
              size={ROW_AVATAR}
              title={memberName}
              photoUrl={memberPhotoUrl}
            />
            <View style={styles.labels}>
              <Text
                numberOfLines={1}
                style={[styles.name, {color: colors.textPrimary}]}>
                {memberName}
              </Text>
              <Text
                numberOfLines={1}
                style={[styles.sub, {color: colors.textSecondary}]}>
                {memberEmail}
              </Text>
            </View>
            {memberActive ? <CheckBadge /> : null}
          </Pressable>

          <View
            style={[styles.divider, {backgroundColor: colors.border}]}
          />

          <Text style={[styles.section, {color: colors.textHint}]}>
            {t.botsSection}
          </Text>
          <ScrollView
            style={styles.bots}
            showsVerticalScrollIndicator={false}>
            {bots.map(bot => {
              const active = context === 'bot' && bot.id === activeBotId;
              return (
                <Pressable
                  key={bot.id}
                  accessibilityRole="button"
                  accessibilityState={{selected: active}}
                  onPress={() => onSelectBot(bot.id)}
                  style={[
                    styles.row,
                    active && {backgroundColor: colors.accentSoft},
                  ]}>
                  <View
                    style={[
                      styles.botIcon,
                      {backgroundColor: colors.bgTertiary},
                    ]}>
                    <BotPhoto
                      botId={bot.id}
                      style={styles.botPhoto}
                      fallback={<Bot size={24} color={colors.accent} />}
                    />
                  </View>
                  <View style={styles.labels}>
                    <Text
                      numberOfLines={1}
                      style={[styles.name, {color: colors.textPrimary}]}>
                      {bot.name}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.sub, {color: colors.textSecondary}]}>
                      {bot.connected ? t.connected : t.notConnected}
                    </Text>
                  </View>
                  {active ? (
                    <CheckBadge />
                  ) : bot.connected ? (
                    <View
                      style={[styles.dot, {backgroundColor: colors.online}]}
                    />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <Pressable
            accessibilityRole="button"
            onPress={onClose}
            style={[styles.closeBtn, {backgroundColor: colors.bgSecondary}]}>
            <Text style={[styles.closeText, {color: colors.textSecondary}]}>
              {t.close}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {flex: 1, justifyContent: 'flex-end'},
  sheet: {
    borderTopLeftRadius: radii.bottomSheet,
    borderTopRightRadius: radii.bottomSheet,
    paddingHorizontal: space.sm,
    paddingTop: space.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radii.full,
    marginBottom: space.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radii.lg,
  },
  labels: {flex: 1},
  name: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
  sub: {fontSize: fontSize.listSubtitle},
  badge: {
    width: 32,
    height: 32,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {width: 10, height: 10, borderRadius: radii.full},
  botPhoto: {width: ROW_AVATAR, height: ROW_AVATAR},
  botIcon: {
    overflow: 'hidden',
    width: ROW_AVATAR,
    height: ROW_AVATAR,
    borderRadius: radii.botIcon,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {height: StyleSheet.hairlineWidth, marginVertical: space.sm},
  section: {
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    fontSize: fontSize.listSubtitle,
    fontWeight: fontWeight.semibold,
    letterSpacing: 0.8,
  },
  bots: {maxHeight: BOTS_MAX_HEIGHT},
  closeBtn: {
    marginTop: space.sm,
    marginHorizontal: space.sm,
    paddingVertical: space.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  closeText: {fontSize: fontSize.msgDefault, fontWeight: fontWeight.semibold},
});
