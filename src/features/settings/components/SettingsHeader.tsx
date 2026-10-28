/**
 * En-tête unique des pages Paramètres : ← Titre ⋮ sur fond blanc,
 * barre d'état fondue. Remplace BrandBar + bandeau bleu + ScreenHeader.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {useTheme, space, fontWeight} from '../../../shared/theme';
import {settingsTexts as t} from '../texts';

type Props = {
  title: string;
  /** Absent = page racine (pas de flèche). */
  onBack?: () => void;
  /** Menu ⋮ éventuel. */
  right?: React.ReactNode;
};

export function SettingsHeader({title, onBack, right}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.root,
        {backgroundColor: colors.bgPrimary, borderBottomColor: colors.border},
      ]}>
      <StatusBarStrip seamless />
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.back}
            onPress={onBack}
            hitSlop={8}
            style={styles.back}>
            <ArrowLeft size={24} color={colors.textPrimary} />
          </Pressable>
        ) : null}
        <Text
          numberOfLines={1}
          style={[
            styles.title,
            onBack ? styles.titleWithBack : styles.titleRoot,
            {color: colors.textPrimary},
          ]}>
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {borderBottomWidth: StyleSheet.hairlineWidth},
  row: {
    height: space.brandBarHeight,
    flexDirection: 'row',
    alignItems: 'center',
  },
  back: {
    width: 48,
    height: 48,
    marginLeft: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {flex: 1, fontSize: 20, fontWeight: fontWeight.semibold},
  titleWithBack: {marginLeft: 16},
  titleRoot: {marginLeft: 20},
  right: {paddingRight: 12, minWidth: 12, alignItems: 'flex-end'},
});
