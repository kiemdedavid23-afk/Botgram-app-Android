/**
 * En-tête de sous-page : bandeau de barre d'état + flèche retour + titre centré.
 * Commun à Ajouter un bot et au parcours d'association
 * (modèle settings-common.css .chat-settings__header).
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useTheme, dashboardMetrics as dm, shellMetrics as sm} from '../theme';
import {StatusBarStrip} from './StatusBarStrip';

type Props = {
  title: string;
  /** Sans onBack, un espace remplace la flèche. */
  onBack?: () => void;
};

export function ScreenHeader({title, onBack}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View
      style={{
        backgroundColor: colors.bgPrimary,
        borderBottomColor: colors.divider,
        borderBottomWidth: sm.headerBorderWidth,
      }}>
      <StatusBarStrip />
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            onPress={onBack}
            hitSlop={sm.backHitSlop}
            accessibilityRole="button"
            accessibilityLabel="Retour"
            style={styles.back}>
            <ArrowLeft size={sm.backIconSize} color={colors.textPrimary} />
          </Pressable>
        ) : (
          <View style={styles.back} />
        )}
        <Text
          style={[styles.title, {color: colors.textPrimary}]}
          numberOfLines={1}>
          {title}
        </Text>
        <View style={styles.back} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: dm.subHeaderPadTop,
    paddingRight: dm.subHeaderPadRight,
    paddingBottom: dm.subHeaderPadBottom,
    paddingLeft: dm.subHeaderPadLeft,
  },
  back: {
    width: sm.backBtnSize,
    height: sm.backBtnSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    fontSize: dm.subHeaderTitleSize,
    fontWeight: sm.titleWeight,
  },
});
