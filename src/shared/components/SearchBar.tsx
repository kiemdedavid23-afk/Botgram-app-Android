/**
 * Barre de recherche — ConversationsPage.css .search-bar--main + tokens §5 rayon 12.
 */
import React from 'react';
import {View, TextInput, StyleSheet, Pressable} from 'react-native';
import {Search, X} from 'lucide-react-native';
import {useTheme, fontSize} from '../theme';
import {conversationsMetrics as cm} from '../theme/conversationsMetrics';

type Props = {
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  onClear?: () => void;
};

export function SearchBar({
  value,
  onChangeText,
  placeholder = 'Rechercher',
  onClear,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  return (
    <View
      style={[
        styles.wrap,
        {
          backgroundColor: colors.bgSecondary,
          marginTop: cm.searchMarginT,
          marginHorizontal: cm.searchMarginH,
          marginBottom: cm.searchMarginB,
          borderRadius: cm.searchRadius,
          paddingVertical: cm.searchPaddingV,
          paddingHorizontal: cm.searchPaddingH,
        },
      ]}>
      <Search size={18} color={colors.textHint} strokeWidth={1.8} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textHint}
        style={[styles.input, {color: colors.textPrimary, fontSize: fontSize.listName ?? 15}]}
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 ? (
        <Pressable
          onPress={() => {
            onChangeText('');
            onClear?.();
          }}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Effacer">
          <X size={18} color={colors.textSecondary} strokeWidth={1.8} />
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
  },
});
