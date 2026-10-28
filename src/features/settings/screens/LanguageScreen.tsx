/**
 * Liste des 32 langues — sélection locale, sans traduction (v1).
 */
import React from 'react';
import {View, Text, FlatList, Pressable, StyleSheet} from 'react-native';
import {Check} from 'lucide-react-native';
import {useTheme, settingsMetrics as sm} from '../../../shared/theme';
import {APP_LANGUAGES} from '../languages';
import {settingsTexts as t} from '../texts';
import {SettingsPage} from '../components/SettingsPage';

type Props = {onBack: () => void};

function Separator(): React.JSX.Element {
  const {colors} = useTheme();
  return <View style={[styles.sep, {backgroundColor: colors.borderSoft}]} />;
}

export function LanguageScreen({onBack}: Props): React.JSX.Element {
  const {colors, appearance, setAppearance} = useTheme();

  return (
    <SettingsPage title={t.languageTitle} onBack={onBack}>
      <View style={[styles.card, {backgroundColor: colors.bgPrimary}]}>
        <FlatList
          data={APP_LANGUAGES}
          keyExtractor={item => item.code}
          ListHeaderComponent={
            <Text style={[styles.hint, {color: colors.textSecondary}]}>
              {t.languageHint}
            </Text>
          }
          ItemSeparatorComponent={Separator}
          renderItem={({item}) => {
            const active = appearance.uiLanguage === item.code;
            return (
              <Pressable
                accessibilityRole="radio"
                accessibilityState={{selected: active}}
                onPress={() => setAppearance({uiLanguage: item.code})}
                android_ripple={{color: colors.accentSoft}}
                style={styles.row}>
                <View style={styles.labels}>
                  <Text style={[styles.native, {color: colors.textPrimary}]}>
                    {item.nativeName}
                  </Text>
                  <Text style={{color: colors.textSecondary, fontSize: sm.subSize}}>
                    {item.name}
                  </Text>
                </View>
                {active ? <Check size={22} color={colors.accent} /> : null}
              </Pressable>
            );
          }}
        />
      </View>
    </SettingsPage>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    margin: sm.cardMarginH,
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
  },
  hint: {fontSize: sm.subSize, paddingHorizontal: 20, paddingVertical: 14},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 56,
    paddingHorizontal: 20,
    gap: 12,
  },
  labels: {flex: 1, gap: 2},
  native: {fontSize: 17},
  sep: {height: StyleSheet.hairlineWidth, marginLeft: 20},
});
