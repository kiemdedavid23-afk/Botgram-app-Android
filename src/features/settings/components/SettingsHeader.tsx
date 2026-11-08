/**
 * En-tête unique des pages Paramètres : ← Titre ⋮.
 * Botgram : fond blanc, filet, barre d'état fondue. Entreprise : fond de page, grand titre,
 * flèche dans un carré doux (comme l'en-tête du tableau de bord).
 */
import React from 'react';
import {View, Text, Pressable, StatusBar, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {StatusBarStrip} from '../../../shared/components/StatusBarStrip';
import {useTheme, space, fontWeight} from '../../../shared/theme';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';
import {settingsTexts as t} from '../texts';
import {useSettingsPalette} from './settingsPalette';

type Props = {
  title: string;
  /** Absent = page racine (pas de flèche). */
  onBack?: () => void;
  /** Menu ⋮ éventuel. */
  right?: React.ReactNode;
};

export function SettingsHeader({title, onBack, right}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const p = useSettingsPalette();
  const c = useCompanyTheme();
  const insets = useSafeAreaInsets();

  if (p.company) {
    return (
      <View style={{backgroundColor: p.headerBg}}>
        <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
        <View style={{height: insets.top}} />
        <View style={styles.cRow}>
          {onBack ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.back}
              onPress={onBack}
              hitSlop={8}
              style={({pressed}) => [styles.cBack, {backgroundColor: c.soft, opacity: pressed ? 0.7 : 1}]}>
              <ArrowLeft size={22} color={c.ink} />
            </Pressable>
          ) : null}
          <Text numberOfLines={1} style={[styles.cTitle, {color: c.ink}]}>
            {title}
          </Text>
          <View style={styles.right}>{right}</View>
        </View>
      </View>
    );
  }

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
  cRow: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: cm.pageH, paddingTop: 8, paddingBottom: 14},
  cBack: {width: cm.headerBtn, height: cm.headerBtn, borderRadius: cm.headerBtnRadius, alignItems: 'center', justifyContent: 'center'},
  cTitle: {flex: 1, fontFamily: companyFonts.display, fontSize: cm.nameSize, fontWeight: '700', letterSpacing: -0.3},
});
