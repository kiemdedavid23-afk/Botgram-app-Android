/**
 * En-tête de sous-page (settings-common.css .chat-settings__header).
 * Flèche retour, titre 18/600, padding 8 8 8 4, fond bgPrimary, bordure basse.
 */
import React, {type ReactNode} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useTheme, dashboardMetrics as dm} from '../theme';

type Props = {
  title: string;
  onBack: () => void;
  children: ReactNode;
};

export function SettingsShell({title, onBack, children}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.bgPrimary,
            borderBottomColor: colors.divider,
          },
        ]}>
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          style={styles.backBtn}>
          <ArrowLeft size={22} color={colors.textPrimary} />
        </Pressable>
        <Text
          style={[
            styles.title,
            {color: colors.textPrimary},
          ]}
          numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.backBtn} />
      </View>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: dm.subHeaderPadTop,
    paddingRight: dm.subHeaderPadRight,
    paddingBottom: dm.subHeaderPadBottom,
    paddingLeft: dm.subHeaderPadLeft,
    borderBottomWidth: 1,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: dm.subHeaderTitleSize,
    fontWeight: '600',
  },
  body: {flex: 1},
});
