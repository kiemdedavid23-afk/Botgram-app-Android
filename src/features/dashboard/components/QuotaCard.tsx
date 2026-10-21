/**
 * Carte quota quotidien — anneau SVG + libellés.
 * Couleurs : vert <65, warn ≥65, danger ≥90 (DashboardPage.css).
 */
import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';
import Svg, {Circle} from 'react-native-svg';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';
import {quotaTone, quotaPercent, type QuotaTone} from '../logic';
import {texts, quotaHint} from '../texts';

type Props = {
  used: number | null;
  limit: number | null;
  remaining: number | null;
  reduceMotion: boolean;
};

function toneColor(
  tone: QuotaTone,
  colors: {online: string; warn: string; danger: string},
): string {
  if (tone === 'red') return colors.danger;
  if (tone === 'orange') return colors.warn;
  return colors.online;
}

export function QuotaCard({
  used,
  limit,
  remaining,
  reduceMotion,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const tone = quotaTone(used, limit);
  const pct = quotaPercent(used, limit);
  const color = toneColor(tone, colors);
  const progress = useRef(new Animated.Value(0)).current;
  const countAnim = useRef(new Animated.Value(0)).current;
  const [displayPct, setDisplayPct] = React.useState(0);

  useEffect(() => {
    if (reduceMotion) {
      progress.setValue(pct);
      setDisplayPct(Math.round(pct));
      return;
    }
    progress.setValue(0);
    countAnim.setValue(0);
    const t = setTimeout(() => {
      Animated.timing(progress, {
        toValue: pct,
        duration: 1100,
        useNativeDriver: false,
      }).start();
      Animated.timing(countAnim, {
        toValue: pct,
        duration: 900,
        useNativeDriver: false,
      }).start();
    }, 120);
    const id = countAnim.addListener(({value}) => {
      setDisplayPct(Math.round(value));
    });
    return () => {
      clearTimeout(t);
      countAnim.removeListener(id);
    };
  }, [pct, reduceMotion, progress, countAnim]);

  const r = dm.ringRadius;
  const c = 2 * Math.PI * r;
  const strokeDashoffset = progress.interpolate({
    inputRange: [0, 100],
    outputRange: [c, 0],
  });

  const usedLabel = used === null ? '–' : String(used);
  const limitLabel = limit === null ? '–' : String(limit);

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.bgPrimary,
          borderColor: colors.border,
        },
      ]}>
      <View style={styles.row}>
        <View style={styles.ringWrap}>
          <Svg width={dm.ringSize} height={dm.ringSize}>
            <Circle
              cx={dm.ringSize / 2}
              cy={dm.ringSize / 2}
              r={r}
              stroke={colors.bgSecondary}
              strokeWidth={dm.ringStroke}
              fill="none"
            />
            <AnimatedCircle
              cx={dm.ringSize / 2}
              cy={dm.ringSize / 2}
              r={r}
              stroke={color}
              strokeWidth={dm.ringStroke}
              fill="none"
              strokeLinecap="round"
              strokeDasharray={`${c} ${c}`}
              strokeDashoffset={strokeDashoffset}
              rotation="-90"
              origin={`${dm.ringSize / 2}, ${dm.ringSize / 2}`}
            />
          </Svg>
          <Text style={[styles.pct, {color}]}>{displayPct} %</Text>
        </View>
        <View style={styles.body}>
          <Text style={{color: colors.textPrimary}}>
            <Text style={styles.used}>{usedLabel}</Text>
            <Text style={styles.limit}>
              {' '}
              / {limitLabel} {texts.messagesUnit}
            </Text>
          </Text>
          <Text style={[styles.line, {color: colors.textSecondary}]}>
            {texts.usedToday}
          </Text>
          <Text style={[styles.hint, {color: colors.textSecondary}]}>
            {quotaHint(tone, remaining)}
          </Text>
        </View>
      </View>
    </View>
  );
}

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const styles = StyleSheet.create({
  card: {
    borderRadius: dm.botCardRadius,
    borderWidth: 1,
    padding: dm.quotaCardPad,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  row: {flexDirection: 'row', alignItems: 'center', gap: dm.quotaCardGap},
  ringWrap: {
    width: dm.ringSize,
    height: dm.ringSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pct: {
    position: 'absolute',
    fontSize: dm.quotaPctSize,
    fontWeight: '800',
    letterSpacing: -0.02 * dm.quotaPctSize,
  },
  body: {flex: 1},
  used: {fontSize: dm.quotaUsedSize, fontWeight: '800'},
  limit: {fontSize: dm.quotaLimitSize},
  line: {fontSize: dm.quotaHintSize, marginTop: 2},
  hint: {
    fontSize: dm.quotaHintLine,
    lineHeight: dm.quotaHintLine * 1.45,
    marginTop: 8,
  },
});
