/**
 * Carte bot + emplacement « Ajouter un bot » — DashboardPage.css .db-slot.
 * Icône : linear-gradient(145deg, accent-soft, accent 24%) l.213.
 * Empty : border 2 dashed, no shadow, press scale 0.985 l.195-205.
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated} from 'react-native';
import {Bot, Plus, ChevronRight} from 'lucide-react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {BotPhoto} from '../../../shared/components/BotPhoto';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';
import type {Bot as BotType} from '../../../core/api/endpoints/bots';
import {isBotConnected} from '../logic';
import {texts} from '../texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

type BotCardProps = {
  bot: BotType;
  onPress: () => void;
  busy?: boolean;
};

export function BotCard({bot, onPress, busy}: BotCardProps): React.JSX.Element {
  const {colors} = useTheme();
  const reduceMotion = useReducedMotion();
  const connected = isBotConnected(bot.status);
  const scale = useRef(new Animated.Value(1)).current;
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!connected || reduceMotion) {
      pulse.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1900,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [connected, reduceMotion, pulse]);

  const ringScale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.4],
  });
  const ringOp = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 0],
  });

  const animatePress = (to: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: to,
      duration: dm.pressDurationMs,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      disabled={busy}
      onPressIn={() => animatePress(dm.pressScale)}
      onPressOut={() => animatePress(1)}
      onPress={onPress}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderSoft,
            shadowColor: colors.black,
            transform: [{scale}],
          },
        ]}>
        <View style={styles.iconWrap}>
          <GradientView
            colors={[colors.accentSoft, colors.accentSoft24]}
            angle={145}
            style={styles.iconBox}>
            <BotPhoto
              botId={bot.id}
              style={styles.botPhoto}
              fallback={<Bot size={dm.botIconSize} color={colors.accent} />}
            />
          </GradientView>
          {connected ? (
            <>
              <Animated.View
                style={[
                  styles.pulseRing,
                  {
                    backgroundColor: colors.online,
                    transform: [{scale: ringScale}],
                    opacity: ringOp,
                  },
                ]}
              />
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: colors.online,
                    borderColor: colors.bgPrimary,
                  },
                ]}
              />
            </>
          ) : null}
        </View>
        <View style={styles.meta}>
          <Text
            style={[styles.name, {color: colors.textPrimary}]}
            numberOfLines={1}>
            {bot.name}
          </Text>
          <View
            style={[
              styles.status,
              {
                backgroundColor: connected
                  ? colors.onlineSoft
                  : colors.bgTertiary,
              },
            ]}>
            <Text
              style={[
                styles.statusText,
                {color: connected ? colors.online : colors.textHint},
              ]}>
              {connected ? texts.botActive : texts.botInactive}
            </Text>
          </View>
        </View>
        <ChevronRight size={dm.chevron} color={colors.textHint} />
      </Animated.View>
    </Pressable>
  );
}

type AddSlotProps = {onPress: () => void};

export function AddBotSlot({onPress}: AddSlotProps): React.JSX.Element {
  const {colors} = useTheme();
  const reduceMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (reduceMotion) {
      breath.setValue(0);
      return;
    }
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breath, {
          toValue: 1,
          duration: 1400,
          useNativeDriver: true,
        }),
        Animated.timing(breath, {
          toValue: 0,
          duration: 1400,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, breath]);

  const iconScale = breath.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.07],
  });

  const animatePress = (to: number) => {
    if (reduceMotion) return;
    Animated.timing(scale, {
      toValue: to,
      duration: dm.pressDurationMs,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Pressable
      onPressIn={() => animatePress(dm.pressScale)}
      onPressOut={() => animatePress(1)}
      onPress={onPress}>
      <Animated.View
        style={[
          styles.addCard,
          {
            borderColor: colors.border,
            transform: [{scale}],
          },
        ]}>
        <Animated.View
          style={[
            styles.iconBoxSolid,
            {
              backgroundColor: colors.accentSoft,
              transform: [{scale: iconScale}],
            },
          ]}>
          <Plus size={dm.addbotPlusIcon} color={colors.accent} />
        </Animated.View>
        <Text style={[styles.addLabel, {color: colors.accent}]}>
          {texts.addBot}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dm.botCardPadV,
    paddingHorizontal: dm.botCardPadH,
    gap: dm.botCardGap,
    borderRadius: dm.botCardRadius,
    borderWidth: dm.botCardBorderW,
    elevation: dm.shadowElevation,
    shadowOpacity: dm.shadowOpacity,
    shadowRadius: dm.shadowRadius,
    shadowOffset: {width: 0, height: dm.shadowOffsetY},
  },
  iconWrap: {width: dm.botIconBox, height: dm.botIconBox},
  iconBox: {
    width: dm.botIconBox,
    height: dm.botIconBox,
    borderRadius: dm.botIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  botPhoto: {width: dm.botIconBox, height: dm.botIconBox},
  iconBoxSolid: {
    width: dm.botIconBox,
    height: dm.botIconBox,
    borderRadius: dm.botIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    top: dm.onlineDotOffset,
    right: dm.onlineDotOffset,
    width: dm.onlineDot,
    height: dm.onlineDot,
    borderRadius: dm.onlineDot / 2,
    borderWidth: dm.onlineDotBorder,
  },
  pulseRing: {
    position: 'absolute',
    top: dm.onlineDotOffset,
    right: dm.onlineDotOffset,
    width: dm.onlineDot,
    height: dm.onlineDot,
    borderRadius: dm.onlineDot / 2,
  },
  meta: {flex: 1, gap: 4},
  name: {fontSize: dm.botNameSize, fontWeight: dm.weight600},
  status: {
    alignSelf: 'flex-start',
    borderRadius: dm.statusRadius,
    paddingVertical: dm.statusPadV,
    paddingHorizontal: dm.statusPadH,
  },
  statusText: {
    fontSize: dm.statusFont,
    fontWeight: dm.weight700,
    letterSpacing: 0.04 * dm.statusFont,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dm.botCardPadV,
    paddingHorizontal: dm.botCardPadH,
    gap: dm.botCardGap,
    borderRadius: dm.botCardRadius,
    borderWidth: dm.emptyBorderW,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addLabel: {fontSize: dm.addbotLabelSize, fontWeight: dm.weight600},
});
