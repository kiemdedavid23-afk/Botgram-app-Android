/**
 * Liste des 32 langues — sélection locale, sans traduction (v1).
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  Pressable,
  StyleSheet,
} from 'react-native';
import {Check} from 'lucide-react-native';
import {SettingsShell} from '../../../shared/components/SettingsShell';
import {useTheme, settingsMetrics as sm, getShadow} from '../../../shared/theme';
import {APP_LANGUAGES} from '../languages';
import {settingsTexts as t} from '../texts';

type Props = {onBack: () => void};

export function LanguageScreen({onBack}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();

  return (
    <SettingsShell title={t.languageTitle} onBack={onBack}>
      <Text style={[styles.hint, {color: colors.textSecondary}]}>
        {t.languageHint}
      </Text>
      <FlatList
        data={APP_LANGUAGES}
        keyExtractor={item => item.code}
        contentContainerStyle={styles.list}
        renderItem={({item}) => {
          const active = appearance.uiLanguage === item.code;
          return (
            <Pressable
              onPress={() => setAppearance({uiLanguage: item.code})}
              style={({pressed}) => [
                styles.row,
                {
                  backgroundColor: colors.bgPrimary,
                },
                getShadow('sm', mode),
                pressed && {opacity: 0.9},
              ]}>
              <View style={styles.labels}>
                <Text style={[styles.native, {color: colors.textPrimary}]}>
                  {item.nativeName}
                </Text>
                <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
                  {item.name}
                </Text>
              </View>
              {active ? <Check size={20} color={colors.accent} /> : null}
            </Pressable>
          );
        }}
      />
    </SettingsShell>
  );
}

const styles = StyleSheet.create({
  hint: {
    marginHorizontal: sm.cardMarginH,
    marginTop: 8,
    marginBottom: 8,
    fontSize: sm.subSize,
  },
  list: {
    paddingHorizontal: sm.cardMarginH,
    paddingBottom: 40,
    gap: 8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: sm.cardRadius,
    gap: 12,
  },
  labels: {flex: 1, gap: 2},
  native: {fontSize: 16, fontWeight: '600'},
});
