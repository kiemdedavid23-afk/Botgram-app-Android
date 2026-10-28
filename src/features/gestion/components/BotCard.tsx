/**
 * Carte bot — GestionPage.css .g-bot
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated, ActivityIndicator} from 'react-native';
import {Bot as BotIcon, RefreshCw, Unplug, Trash2} from 'lucide-react-native';
import {BotPhoto} from '../../../shared/components/BotPhoto';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import type {Bot} from '../../../core/api/endpoints/bots';
import {
  webhookOf,
  isBotConnected,
  botStatusLabel,
  webhookLabel,
  botActionsAvailable,
} from '../../bots/utils/webhook';
import {texts} from '../texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type Props = {
  bot: Bot;
  isDefault: boolean;
  busyKey: string | null;
  onRetry: () => void;
  onResync: () => void;
  onDisconnect: () => void;
  onDelete: () => void;
};

export function BotCard({
  bot,
  isDefault,
  busyKey,
  onRetry,
  onResync,
  onDisconnect,
  onDelete,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const reduce = useReducedMotion();
  const connected = isBotConnected(bot.status);
  const webhook = webhookOf(bot);
  const actions = botActionsAvailable(bot);
  const working = busyKey?.startsWith(`${bot.id}:`) ?? false;
  const pulse = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    if (!connected || reduce) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 0,
          duration: 950,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.5,
          duration: 950,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [connected, reduce, pulse]);

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.bgPrimary, borderColor: colors.borderSoft},
        getShadow('sm', mode),
      ]}>
      <View style={styles.top}>
        <View style={[styles.icon, {backgroundColor: colors.accentSoft}]}>
          <BotPhoto
            botId={bot.id}
            style={styles.photo}
            fallback={<BotIcon size={g.botIconGlyph} color={colors.accent} />}
          />
          {connected ? (
            <Animated.View
              style={[
                styles.pulse,
                {backgroundColor: colors.online, opacity: pulse},
              ]}
            />
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text style={[styles.name, {color: colors.textPrimary}]} numberOfLines={1}>
            {bot.name || 'Bot'}
          </Text>
          {bot.username ? (
            <Text style={[styles.user, {color: colors.textSecondary}]}>
              @{bot.username}
            </Text>
          ) : null}
        </View>
        {isDefault ? (
          <View style={[styles.badge, {backgroundColor: colors.accentSoft}]}>
            <Text style={[styles.badgeText, {color: colors.accent}]}>
              {texts.badgeDefault}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.statusRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: connected
                ? colors.badgeGoodBg
                : colors.bgTertiary,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {color: connected ? colors.badgeGoodText : colors.textSecondary},
            ]}>
            {botStatusLabel(bot.status)}
          </Text>
        </View>
        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                webhook === 'ok'
                  ? colors.badgeGoodBg
                  : webhook === 'error'
                    ? colors.badgeBadBg
                    : colors.bgTertiary,
            },
          ]}>
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  webhook === 'ok'
                    ? colors.badgeGoodText
                    : webhook === 'error'
                      ? colors.danger
                      : colors.textSecondary,
              },
            ]}>
            {webhookLabel(webhook)}
          </Text>
        </View>
        {working ? <ActivityIndicator size="small" color={colors.accent} /> : null}
      </View>

      <View style={styles.actions}>
        {actions.retry ? (
          <Action
            label={texts.actionRetry}
            icon={<RefreshCw size={16} color={colors.accent} />}
            disabled={working}
            onPress={onRetry}
          />
        ) : null}
        {actions.resync ? (
          <Action
            label={texts.actionResync}
            icon={<RefreshCw size={16} color={colors.accent} />}
            disabled={working}
            onPress={onResync}
          />
        ) : null}
        {actions.disconnect ? (
          <Action
            label={texts.actionDisconnect}
            icon={<Unplug size={16} color={colors.danger} />}
            disabled={working}
            danger
            onPress={onDisconnect}
          />
        ) : null}
        {actions.delete ? (
          <Action
            label={texts.actionDelete}
            icon={<Trash2 size={16} color={colors.danger} />}
            disabled={working}
            danger
            onPress={onDelete}
          />
        ) : null}
      </View>
    </View>
  );
}

function Action({
  label,
  icon,
  onPress,
  disabled,
  danger,
}: {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
}): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({pressed}) => [
        styles.action,
        {
          backgroundColor: pressed ? colors.bgSecondary : colors.bgTertiary,
          opacity: disabled ? 0.5 : 1,
        },
      ]}>
      {icon}
      <Text
        style={[
          styles.actionText,
          {color: danger ? colors.danger : colors.textPrimary},
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: g.cardRadius,
    borderWidth: 1,
    padding: g.cardPad,
    gap: g.cardGap,
  },
  top: {flexDirection: 'row', alignItems: 'center', gap: 12},
  icon: {
    width: g.botIcon,
    height: g.botIcon,
    borderRadius: g.botIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photo: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: g.botIcon,
    height: g.botIcon,
    borderRadius: g.botIconRadius,
  },
  pulse: {
    position: 'absolute',
    right: -2,
    top: -2,
    width: g.pulseSize,
    height: g.pulseSize,
    borderRadius: g.pulseSize / 2,
  },
  meta: {flex: 1, minWidth: 0},
  name: {fontSize: 16, fontWeight: '700'},
  user: {fontSize: 13},
  statusRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center'},
  badge: {
    borderRadius: 99,
    paddingVertical: g.badgePadV,
    paddingHorizontal: g.badgePadH,
  },
  badgeText: {fontSize: g.badgeFont, fontWeight: '700'},
  actions: {gap: g.actionGap},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: g.actionPadV,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  actionText: {fontSize: g.actionFont, fontWeight: '600'},
});
