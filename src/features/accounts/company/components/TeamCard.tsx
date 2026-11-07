import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Users} from 'lucide-react-native';
import {GradientView} from '../../../../shared/components/GradientView';
import {TEAM_MAX} from '../companyLogic';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';
import {Card, ArrowButton} from './ui';

type Props = {count: number; ownerName: string; onOpen: () => void};

/** Ligne unique « Équipe » : icône bleue, effectif, flèche. */
export function TeamCard({count, ownerName, onOpen}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Pressable accessibilityRole="button" onPress={onOpen}>
      <Card padded={false}>
        <View style={styles.row}>
          <View style={styles.icon}>
            <GradientView colors={[t.primaryHi, t.primary]} angle={150} style={StyleSheet.absoluteFill} />
            <Users size={22} color="#FFFFFF" />
          </View>
          <View style={styles.main}>
            <Text style={[styles.title, {color: t.ink}]}>Équipe</Text>
            <Text style={[styles.sub, {color: t.inkSoft}]} numberOfLines={1}>
              {`${count} / ${TEAM_MAX} personnes${ownerName ? ` · ${ownerName}` : ''}`}
            </Text>
          </View>
          <ArrowButton onPress={onOpen} label="Ouvrir l’équipe" />
        </View>
      </Card>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20},
  icon: {width: 40, height: 40, borderRadius: 13, overflow: 'hidden', alignItems: 'center', justifyContent: 'center'},
  main: {flex: 1},
  title: {fontFamily: companyFonts.display, fontSize: cm.cardPad + 2, fontWeight: '700'},
  sub: {fontFamily: companyFonts.body, fontSize: 14, marginTop: 1},
});
