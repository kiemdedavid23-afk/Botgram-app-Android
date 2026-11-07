import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {monogram, roleTag, teamFill, TEAM_MAX} from '../companyLogic';
import type {WorkspaceRole} from '../../../../core/api/endpoints/workspaces';
import {companyFonts, companyMetrics as cm, useCompanyTheme} from '../companyTheme';
import {Panel} from './Primitives';

type Props = {
  ownerName: string;
  count: number;
  role: WorkspaceRole;
  /** Ouvre l'écran Équipe. */
  onOpen?: () => void;
};

/** Effectif de l'équipe et responsable ; le détail des personnes arrive avec l'écran Équipe. */
export function TeamPanel({ownerName, count, role, onOpen}: Props): React.JSX.Element {
  const t = useCompanyTheme();
  return (
    <Panel>
      <View style={styles.owner}>
        <View style={[styles.avatar, {backgroundColor: t.navy}]}>
          <Text style={[styles.avatarText, {color: t.gold}]}>{monogram(ownerName)}</Text>
        </View>
        <View style={styles.flex}>
          <Text style={[styles.name, {color: t.ink}]} numberOfLines={1}>
            {ownerName || '—'}
          </Text>
          <Text style={[styles.role, {color: t.inkSoft}]}>Responsable de l’entreprise</Text>
        </View>
        <View style={[styles.tag, {backgroundColor: t.goldSoft}]}>
          <Text style={[styles.tagText, {color: t.gold}]}>{roleTag(role)}</Text>
        </View>
      </View>
      <View style={[styles.foot, {borderTopColor: t.line}]}>
        <View style={styles.footTop}>
          <Text style={[styles.count, {color: t.ink}]}>
            {count}
            <Text style={[styles.max, {color: t.inkSoft}]}>{` / ${TEAM_MAX} personnes`}</Text>
          </Text>
        </View>
        <View style={[styles.track, {backgroundColor: t.line}]}>
          <View style={[styles.fill, {backgroundColor: t.navy, width: `${teamFill(count) * 100}%`}]} />
        </View>
      </View>
      {onOpen ? (
        <Pressable
          accessibilityRole="button"
          onPress={onOpen}
          style={[styles.open, {borderTopColor: t.line}]}>
          <Text style={[styles.openText, {color: t.gold}]}>Gérer l’équipe</Text>
        </Pressable>
      ) : null}
    </Panel>
  );
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  owner: {flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14},
  avatar: {width: cm.monogram, height: cm.monogram, borderRadius: cm.radius, alignItems: 'center', justifyContent: 'center'},
  avatarText: {fontFamily: companyFonts.display, fontSize: 16, fontWeight: '700'},
  name: {fontFamily: companyFonts.value, fontSize: 15, fontWeight: '600'},
  role: {fontFamily: companyFonts.body, fontSize: 12.5, marginTop: 1},
  tag: {paddingHorizontal: 8, paddingVertical: 4, borderRadius: 2},
  tagText: {fontFamily: companyFonts.label, fontSize: 11, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8},
  foot: {borderTopWidth: StyleSheet.hairlineWidth, paddingHorizontal: 14, paddingVertical: 12, gap: 8},
  footTop: {flexDirection: 'row', alignItems: 'baseline'},
  count: {fontFamily: companyFonts.display, fontSize: 20, fontWeight: '700'},
  max: {fontFamily: companyFonts.body, fontSize: 13, fontWeight: '400'},
  open: {borderTopWidth: StyleSheet.hairlineWidth, paddingVertical: 13, alignItems: 'center'},
  openText: {fontFamily: companyFonts.label, fontSize: 13, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1},
  track: {height: 4, borderRadius: 2, overflow: 'hidden'},
  fill: {height: 4},
});
