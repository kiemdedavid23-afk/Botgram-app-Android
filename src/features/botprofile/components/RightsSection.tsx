/** Droits — site RightsSection + .bp-switch */
import React, {useMemo, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {ColorTokens} from '../../../shared/theme';
import type {
  AdminRightKey, AdminRights, BotProfile,
} from '../../../core/api/endpoints/botProfile.types';
import {ADMIN_RIGHT_KEYS} from '../../../core/api/endpoints/botProfile.types';
import {RIGHT_LABELS, RIGHT_SCOPE} from '../utils/labels';
import {texts} from '../texts';

type Target = 'groups' | 'channels';
type Props = {
  draft: BotProfile;
  onToggle: (target: Target, key: AdminRightKey, value: boolean) => void;
  onSetAll: (target: Target, value: boolean) => void;
};

function keysFor(target: Target): AdminRightKey[] {
  return ADMIN_RIGHT_KEYS.filter(k => {
    const scope = RIGHT_SCOPE[k];
    return scope === 'both' || scope === target;
  });
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {paddingBottom: 6},
    title: {
      fontSize: m.titleFontSize, fontWeight: m.titleFontWeight,
      paddingHorizontal: m.headPaddingH, paddingTop: m.headPaddingTop,
      paddingBottom: m.headPaddingBottom, color: c.textPrimary,
    },
    tabs: {
      flexDirection: 'row', gap: m.tabsGap,
      paddingHorizontal: m.headPaddingH, marginBottom: m.tabsMarginBottom,
    },
    tab: {
      paddingVertical: m.tabPadV, paddingHorizontal: m.tabPadH,
      borderRadius: m.tabRadius, borderWidth: 1, borderColor: c.border,
    },
    tabOn: {backgroundColor: c.accent},
    tabOff: {backgroundColor: c.bgPrimary},
    tabTextOn: {color: c.white, fontWeight: m.tabFontWeight, fontSize: m.tabFontSize},
    tabTextOff: {color: c.textSecondary, fontWeight: m.tabFontWeight, fontSize: m.tabFontSize},
    actions: {
      flexDirection: 'row', gap: m.actionsGap,
      paddingHorizontal: m.headPaddingH, marginBottom: m.actionsMarginBottom,
    },
    btn: {
      paddingVertical: m.btnPadV, paddingHorizontal: m.btnPadH, borderRadius: m.btnRadius,
    },
    btnAccent: {backgroundColor: c.accentSoft},
    btnMuted: {backgroundColor: c.bgSecondary},
    btnTextAccent: {color: c.accent, fontWeight: m.tabFontWeight},
    btnTextMuted: {color: c.textSecondary, fontWeight: m.tabFontWeight},
    card: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius,
      borderWidth: 1, borderColor: c.border, backgroundColor: c.bgPrimary, overflow: 'hidden',
    },
    div: {height: StyleSheet.hairlineWidth, marginLeft: m.headPaddingH, backgroundColor: c.border},
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: m.rowPaddingV, paddingHorizontal: m.rowPaddingH, gap: 12,
    },
    label: {flex: 1, fontSize: m.labelSize, fontWeight: m.labelWeight, color: c.textPrimary},
    sw: {
      width: m.switchWidth, height: m.switchHeight, borderRadius: 99, justifyContent: 'center',
    },
    swOn: {backgroundColor: c.accent},
    swOff: {backgroundColor: c.bgTertiary},
    knob: {
      position: 'absolute', top: m.knobOffset, left: m.knobOffset,
      width: m.knobSize, height: m.knobSize, borderRadius: m.knobSize / 2,
      backgroundColor: c.white,
    },
    knobOn: {transform: [{translateX: m.knobTravel}]},
  });
}

export function RightsSection({draft, onToggle, onSetAll}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [target, setTarget] = useState<Target>('groups');
  const rights: AdminRights = draft.admin_rights[target];
  const keys = keysFor(target);

  return (
    <View style={styles.root}>
      <Text style={styles.title}>{texts.rightsTitle}</Text>
      <View style={styles.tabs}>
        {(['groups', 'channels'] as const).map(t => {
          const on = t === target;
          return (
            <Pressable
              key={t}
              onPress={() => setTarget(t)}
              style={[styles.tab, on ? styles.tabOn : styles.tabOff]}>
              <Text style={on ? styles.tabTextOn : styles.tabTextOff}>
                {t === 'groups' ? texts.rightsGroups : texts.rightsChannels}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable onPress={() => onSetAll(target, true)} style={[styles.btn, styles.btnAccent]}>
          <Text style={styles.btnTextAccent}>{texts.rightsAll}</Text>
        </Pressable>
        <Pressable onPress={() => onSetAll(target, false)} style={[styles.btn, styles.btnMuted]}>
          <Text style={styles.btnTextMuted}>{texts.rightsNone}</Text>
        </Pressable>
      </View>
      <View style={styles.card}>
        {keys.map((key, i) => {
          const on = rights[key] === true;
          return (
            <View key={key}>
              {i > 0 ? <View style={styles.div} /> : null}
              <View style={styles.row}>
                <Text style={styles.label}>{RIGHT_LABELS[key]}</Text>
                <Pressable
                  onPress={() => onToggle(target, key, !on)}
                  accessibilityRole="switch"
                  accessibilityState={{checked: on}}
                  style={[styles.sw, on ? styles.swOn : styles.swOff]}>
                  <View style={[styles.knob, on ? styles.knobOn : null]} />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}
