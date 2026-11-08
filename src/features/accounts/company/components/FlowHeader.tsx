import React from 'react';
import {View, Text, Pressable, StatusBar, StyleSheet} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '../../../../shared/theme';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';

type Props = {
  title: string;
  /** Absent = page racine (pas de flèche). */
  onBack?: () => void;
  /** Menu ⋮ éventuel. */
  right?: React.ReactNode;
};

/** En-tête de sous-page, style entreprise : fond de page, grand titre, flèche dans un carré doux. */
export function FlowHeader({title, onBack, right}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const {mode} = useTheme();
  const insets = useSafeAreaInsets();
  return (
    <View style={{backgroundColor: t.bg}}>
      <StatusBar barStyle={mode === 'dark' ? 'light-content' : 'dark-content'} />
      <View style={{height: insets.top}} />
      <View style={styles.row}>
        {onBack ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            onPress={onBack}
            hitSlop={8}
            style={({pressed}) => [styles.back, {backgroundColor: t.soft, opacity: pressed ? 0.7 : 1}]}>
            <ArrowLeft size={22} color={t.ink} />
          </Pressable>
        ) : null}
        <Text numberOfLines={1} style={[styles.title, {color: t.ink}]}>
          {title}
        </Text>
        <View style={styles.right}>{right}</View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: cm.pageH, paddingTop: 8, paddingBottom: 14},
  back: {width: cm.headerBtn, height: cm.headerBtn, borderRadius: cm.headerBtnRadius, alignItems: 'center', justifyContent: 'center'},
  title: {flex: 1, fontFamily: companyFonts.display, fontSize: cm.nameSize, fontWeight: '700', letterSpacing: -0.3},
  right: {minWidth: 12, alignItems: 'flex-end'},
});
