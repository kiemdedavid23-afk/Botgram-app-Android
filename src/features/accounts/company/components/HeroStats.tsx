import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import type {QuotaLevel} from '../companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';
import {CardTitle} from './ui';

export type HeroMain = {
  label: string;
  value: string;
  /** Dénominateur affiché en plus petit (« / 165 »). */
  of?: string;
  /** 0–1 : jauge sous le chiffre. */
  fill?: number;
  /** Colore la jauge quand la limite approche. */
  level?: QuotaLevel;
  note?: string;
};

export type HeroTile = {
  label: string;
  value: string;
  of?: string;
  fill?: number;
  onPress?: () => void;
};

type Props = {
  title: string;
  main: HeroMain;
  /** Deux indicateurs secondaires, toujours visibles d'un coup d'œil. */
  tiles: readonly [HeroTile, HeroTile];
  onOpen?: () => void;
  openLabel?: string;
};

const FILL_WARN = '#FFD479';
const FILL_BAD = '#FF9C94';

function gaugeWidth(fill: number): `${number}%` {
  return `${Math.round(Math.max(0, Math.min(1, fill)) * 100)}%`;
}

function Tile({tile}: {tile: HeroTile}): React.JSX.Element {
  const body = (
    <>
      <Text style={styles.tileLabel} numberOfLines={1}>
        {tile.label}
      </Text>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>
        {tile.value}
        {tile.of ? <Text style={styles.tileOf}>{` ${tile.of}`}</Text> : null}
      </Text>
      {tile.fill !== undefined ? (
        <View style={styles.tileTrack}>
          <View style={[styles.tileFill, {width: gaugeWidth(tile.fill)}]} />
        </View>
      ) : null}
    </>
  );
  const a11y = `${tile.label} : ${tile.value}${tile.of ? ` ${tile.of}` : ''}`;
  if (!tile.onPress) {
    return (
      <View accessible accessibilityLabel={a11y} style={styles.tile}>
        {body}
      </View>
    );
  }
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={a11y}
      onPress={tile.onPress}
      style={({pressed}) => [styles.tile, pressed ? {opacity: 0.8} : null]}>
      {body}
    </Pressable>
  );
}

/**
 * Grande carte colorée : l'indicateur principal en grand, deux autres en dessous.
 * Tout est visible sans défiler ; texte blanc sur le dégradé de la couleur de marque.
 */
export function HeroStats({title, main, tiles, onOpen, openLabel}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  const fillColor = main.level === 'bad' ? FILL_BAD : main.level === 'warn' ? FILL_WARN : '#FFFFFF';
  return (
    <View style={[styles.hero, {shadowColor: t.heroLo}]}>
      <GradientView colors={[t.heroHi, t.heroLo]} angle={160} style={StyleSheet.absoluteFill} />
      <CardTitle title={title} color={t.onHero} onPress={onOpen} actionLabel={openLabel} onColor />
      <View
        accessible
        accessibilityLabel={`${main.label} : ${main.value}${main.of ? ` ${main.of}` : ''}. ${main.note ?? ''}`}
        style={styles.main}>
        <Text style={styles.mainLabel}>{main.label}</Text>
        <Text style={styles.mainValue} numberOfLines={1} adjustsFontSizeToFit>
          {main.value}
          {main.of ? <Text style={styles.mainOf}>{` ${main.of}`}</Text> : null}
        </Text>
        {main.fill !== undefined ? (
          <View style={styles.track}>
            <View style={[styles.fill, {width: gaugeWidth(main.fill), backgroundColor: fillColor}]} />
          </View>
        ) : null}
        {main.note ? <Text style={styles.note}>{main.note}</Text> : null}
      </View>
      <View style={styles.tiles}>
        <Tile tile={tiles[0]} />
        <Tile tile={tiles[1]} />
      </View>
    </View>
  );
}

const WHITE = '#FFFFFF';

const styles = StyleSheet.create({
  hero: {
    borderRadius: cm.cardRadius,
    overflow: 'hidden',
    padding: cm.cardPad,
    gap: 14,
    shadowOpacity: 0.3,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 10},
    elevation: 5,
  },
  main: {gap: 6},
  mainLabel: {fontFamily: companyFonts.body, fontSize: cm.subSize, color: WHITE},
  mainValue: {fontFamily: companyFonts.display, fontSize: cm.heroValueSize, fontWeight: '700', color: WHITE, letterSpacing: -0.6},
  mainOf: {fontSize: cm.titleSize, fontWeight: '400', color: WHITE},
  track: {height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden'},
  fill: {height: 6, borderRadius: 3},
  note: {fontFamily: companyFonts.body, fontSize: cm.captionSize, color: WHITE},
  tiles: {flexDirection: 'row', gap: 12},
  tile: {flex: 1, borderRadius: 22, padding: 14, gap: 4, backgroundColor: 'rgba(10,15,60,0.24)'},
  tileLabel: {fontFamily: companyFonts.body, fontSize: cm.captionSize, color: WHITE},
  tileValue: {fontFamily: companyFonts.display, fontSize: cm.tileValueSize, fontWeight: '700', color: WHITE},
  tileOf: {fontSize: cm.subSize, fontWeight: '400', color: WHITE},
  tileTrack: {height: 4, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden', marginTop: 4},
  tileFill: {height: 4, borderRadius: 2, backgroundColor: WHITE},
});
