/**
 * « Thème de couleur » : carrousel horizontal de fonds (fond + bulles + emoji).
 */
import React from 'react';
import {View, Text, ScrollView, Pressable, StyleSheet} from 'react-native';
import {GradientView} from '../../../shared/components/GradientView';
import {
  useTheme,
  wallpapers,
  wallpaperBubbleOut,
  type WallpaperId,
} from '../../../shared/theme';

const IDS = Object.keys(wallpapers) as WallpaperId[];

export function ThemeCarousel(): React.JSX.Element {
  const {colors, appearance, setAppearance} = useTheme();
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}>
      {IDS.map(id => {
        const wp = wallpapers[id];
        const active = appearance.wallpaper === id;
        return (
          <Pressable
            key={id}
            accessibilityRole="button"
            accessibilityState={{selected: active}}
            accessibilityLabel={wp.label}
            onPress={() => setAppearance({wallpaper: id})}
            style={[
              styles.frame,
              {borderColor: active ? colors.accent : 'transparent'},
            ]}>
            <GradientView colors={[...wp.colors]} angle={160} style={styles.card}>
              <View style={[styles.pill, styles.pillIn]} />
              <View
                style={[styles.pill, styles.pillOut, {backgroundColor: wallpaperBubbleOut[id]}]}
              />
              <Text style={styles.emoji}>{wp.emoji}</Text>
            </GradientView>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: {paddingHorizontal: 14, paddingVertical: 10, gap: 6},
  frame: {borderWidth: 2.5, borderRadius: 18, padding: 2},
  card: {width: 66, height: 92, borderRadius: 14, padding: 8, gap: 6},
  pill: {height: 20, borderRadius: 10},
  pillIn: {backgroundColor: 'rgba(255,255,255,0.9)', width: '85%'},
  pillOut: {width: '70%', alignSelf: 'flex-end'},
  emoji: {position: 'absolute', bottom: 8, alignSelf: 'center', fontSize: 28},
});
