import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme, fontWeight} from '../../../shared/theme';
import {Avatar} from '../../../shared/components/Avatar';
import {threadMetrics as tm} from '../../../shared/theme/threadMetrics';

type Props = {
  title: string;
  photoUrl?: string | null;
  initials?: string | null;
  onBack: () => void;
};

export function ThreadHeader({
  title,
  photoUrl,
  initials,
  onBack,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View
      style={[
        styles.bar,
        {
          paddingTop: insets.top,
          backgroundColor: colors.bgPrimary,
          borderBottomColor: colors.border,
        },
      ]}>
      <View style={styles.row}>
        <Pressable onPress={onBack} hitSlop={tm.headerHitSlop} accessibilityRole="button">
          <ChevronLeft size={28} color={colors.accent} strokeWidth={2} />
        </Pressable>
        <View style={styles.info}>
          <Avatar
            photoUrl={photoUrl}
            initials={initials}
            title={title}
            size={tm.avatarSize}
          />
          <Text
            numberOfLines={1}
            style={{
              color: colors.textPrimary,
              fontSize: tm.titleSize,
              fontWeight: fontWeight.semibold,
              flex: 1,
            }}>
            {title}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  row: {
    height: tm.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.headerGap,
    paddingLeft: tm.headerPadL,
    paddingRight: tm.headerPadR,
  },
  info: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: tm.headerInfoGap,
    minWidth: 0,
  },
});
