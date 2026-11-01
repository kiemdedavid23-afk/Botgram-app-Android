import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {botfactorMetrics as bm} from '../../../shared/theme/botfactorMetrics';
import {texts as T} from '../texts';

export function FactorHeader({onBack}: {onBack: () => void}): React.JSX.Element {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {backgroundColor: colors.bgPrimary, paddingTop: insets.top + bm.headerPadV},
      ]}>
      <Pressable accessibilityLabel={T.back} onPress={onBack} style={styles.back}>
        <ArrowLeft size={22} color={colors.textPrimary} />
      </Pressable>
      <Avatar size={bm.avatar} title={T.title} initials="BF" />
      <View style={styles.titles}>
        <Text style={[styles.title, {color: colors.textPrimary}]} numberOfLines={1}>
          {T.title}
        </Text>
        <Text style={{color: colors.textSecondary}} numberOfLines={1}>
          {T.subtitle}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: bm.headerGap,
    paddingHorizontal: bm.headerPadH,
    paddingBottom: bm.headerPadV,
  },
  back: {
    width: bm.backSize,
    height: bm.backSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titles: {flex: 1},
  title: {fontSize: 17, fontWeight: '600'},
});
