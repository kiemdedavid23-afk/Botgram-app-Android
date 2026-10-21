/**
 * Carte bot + emplacement « Ajouter un bot » — DashboardPage.css.
 * Icône bot : fond accentSoft (approx. dégradé site, documenté LIVRAISONS).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, Pressable, StyleSheet, Animated} from 'react-native';
import {Bot, Plus, ChevronRight} from 'lucide-react-native';
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

export function BotCard({
  bot,
  onPress,
  busy,
}: BotCardProps): React.JSX.Element {
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

  return (
    <Pressable
      disabled={busy}
      onPressIn={() => {
        if (!reduceMotion) {
          Animated.timing(scale, {
            toValue: dm.pressScale,
            duration: 150,
            useNativeDriver: true,
          }).start();
        }
      }}
      onPressOut={() => {
        Animated.timing(scale, {
          toValue: 1,
          duration: 150,
          useNativeDriver: true,
        }).start();
      }}
      onPress={onPress}
      style={({pressed}) => [{opacity: pressed ? 0.95 : 1}]}>
      <Animated.View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.border,
            transform: [{scale}],
          },
        ]}>
        <View style={styles.iconWrap}>
          <View
            style={[styles.iconBox, {backgroundColor: colors.accentSoft}]}>
            <Bot size={dm.botIconSize} color={colors.accent} />
          </View>
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
              connected ? styles.statusOn : styles.statusOff,
              {backgroundColor: connected ? colors.onlineSoft : colors.bgTertiary},
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

type AddSlotProps = {
  onPress: () => void;
};

export function AddBotSlot({onPress}: AddSlotProps): React.JSX.Element {
  const {colors} = useTheme();
  const reduceMotion = useReducedMotion();
  const breath = useRef(new Animated.Value(0)).current;

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

  return (
    <Pressable onPress={onPress}>
      <View
        style={[
          styles.addCard,
          {borderColor: colors.border},
        ]}>
        <Animated.View
          style={[
            styles.iconBox,
            {backgroundColor: colors.accentSoft, transform: [{scale: iconScale}]},
          ]}>
          <Plus size={20} color={colors.accent} />
        </Animated.View>
        <Text style={[styles.addLabel, {color: colors.accent}]}>
          {texts.addBot}
        </Text>
      </View>
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
    borderWidth: 1,
    // border opacity 55 % approx via couleur border pleine + elevation
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  iconWrap: {width: dm.botIconBox, height: dm.botIconBox},
  iconBox: {
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
  name: {
    fontSize: dm.botNameSize,
    fontWeight: '600',
  },
  status: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingVertical: dm.statusPadV,
    paddingHorizontal: dm.statusPadH,
  },
  statusOn: {},
  statusOff: {},
  statusText: {
    fontSize: dm.statusFont,
    fontWeight: '700',
    letterSpacing: 0.04 * dm.statusFont,
  },
  addCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dm.botCardPadV,
    paddingHorizontal: dm.botCardPadH,
    gap: dm.botCardGap,
    borderRadius: dm.botCardRadius,
    borderWidth: 2,
    borderStyle: 'dashed',
    backgroundColor: 'transparent',
  },
  addLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
});
