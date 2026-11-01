/**
 * Barre de complétion du profil. Si des éléments manquent, un appui déplie
 * la liste de ce qu'il reste à compléter.
 */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {ChevronDown, ChevronUp} from 'lucide-react-native';
import {useTheme} from '../../../shared/theme';
import {botHeroMetrics as h} from '../../../shared/theme/botHeroMetrics';
import {texts} from '../texts';

type Props = {pct: number; missing: string[]};

export function HeroCompletion({pct, missing}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [open, setOpen] = useState(false);
  const complete = missing.length === 0;
  const Chevron = open ? ChevronUp : ChevronDown;

  return (
    <View style={styles.root}>
      <Pressable
        disabled={complete}
        onPress={() => setOpen(o => !o)}
        style={styles.row}
        accessibilityRole={complete ? undefined : 'button'}>
        <View
          style={[
            styles.track,
            {backgroundColor: `rgba(255,255,255,${h.progressTrackAlpha})`},
          ]}>
          <View
            style={[
              styles.fill,
              {width: `${Math.max(0, Math.min(100, pct))}%`, backgroundColor: colors.white},
            ]}
          />
        </View>
        <Text style={[styles.label, {color: colors.heroText}]}>
          {complete ? texts.completeFull : `${pct} % ${texts.completePct}`}
        </Text>
        {complete ? null : <Chevron size={h.actionIcon} color={colors.heroText} />}
      </Pressable>
      {open && !complete ? (
        <Text style={[styles.missing, {color: colors.heroText}]}>
          {texts.missingPrefix} {missing.join(', ')}.
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {alignSelf: 'stretch', gap: h.progressGap, marginTop: 'auto'},
  row: {flexDirection: 'row', alignItems: 'center', gap: h.progressGap},
  track: {flex: 1, height: h.progressHeight, borderRadius: h.progressHeight, overflow: 'hidden'},
  fill: {height: '100%', borderRadius: h.progressHeight},
  label: {fontSize: h.progressFont, fontWeight: '600'},
  missing: {fontSize: h.progressMissingFont, opacity: 0.9},
});
