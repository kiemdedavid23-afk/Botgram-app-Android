import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronRight, type LucideIcon} from 'lucide-react-native';
import {Tile} from '../../accounts/company/components/ui';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../../accounts/company/companyTheme';

type Props = {
  Icon: LucideIcon;
  title: string;
  subtitle?: string;
  onPress: () => void;
};

/** Ligne de réglage du hub (habillage entreprise) : tuile blanche à icône, titre, sous-titre, chevron. */
export function CompanyHubRow({Icon, title, subtitle, onPress}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      onPress={onPress}
      style={({pressed}) => [styles.row, pressed ? {opacity: 0.7} : null]}>
      <Tile>
        <Icon size={24} color={t.primary} strokeWidth={1.9} />
      </Tile>
      <View style={styles.labels}>
        <Text style={[styles.title, {color: t.ink}]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={[styles.sub, {color: t.inkSoft}]} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <ChevronRight size={20} color={t.inkSoft} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 16, paddingVertical: 12},
  labels: {flex: 1, minWidth: 0},
  title: {fontFamily: companyFonts.display, fontSize: cm.rowTitleSize, fontWeight: '600'},
  sub: {fontFamily: companyFonts.body, fontSize: cm.captionSize + 1, marginTop: 2},
});
