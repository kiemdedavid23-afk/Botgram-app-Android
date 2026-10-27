/** Droits (lecture seule) — état des droits d'administrateur par cible. */
import React, {useMemo, useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {Check, X} from 'lucide-react-native';
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
  profile: BotProfile;
};

function keysFor(target: Target): AdminRightKey[] {
  return ADMIN_RIGHT_KEYS.filter(k => {
    const scope = RIGHT_SCOPE[k];
    return scope === 'both' || scope === target;
  });
}

function makeStyles(c: ColorTokens) {
  return StyleSheet.create({
    root: {paddingBottom: m.rootPadBottom},
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
      paddingVertical: m.rightsTabPadV, paddingHorizontal: m.rightsTabPadH,
      borderRadius: m.rightsTabRadius,
    },
    tabOn: {backgroundColor: c.accentSoft},
    tabOff: {backgroundColor: c.bgPrimary},
    tabTextOn: {color: c.accent, fontWeight: m.rightsTabFontWeight, fontSize: m.rightsTabFontSize},
    tabTextOff: {color: c.textSecondary, fontWeight: m.rightsTabFontWeight, fontSize: m.rightsTabFontSize},
    card: {
      marginHorizontal: m.cardMarginH, borderRadius: m.cardRadius,
      backgroundColor: c.bgPrimary, overflow: 'hidden',
    },
    div: {height: StyleSheet.hairlineWidth, marginLeft: m.headPaddingH, backgroundColor: c.border},
    row: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      paddingVertical: m.rowPaddingV, paddingHorizontal: m.rowPaddingH, gap: m.rowGap,
    },
    label: {flex: 1, fontSize: m.rightsLabelSize, fontWeight: m.rightsLabelWeight, color: c.textPrimary},
  });
}

export function RightsSection({profile}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [target, setTarget] = useState<Target>('groups');
  const rights: AdminRights = profile.admin_rights[target];
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
      <View style={styles.card}>
        {keys.map((key, i) => {
          const on = rights[key] === true;
          return (
            <View key={key}>
              {i > 0 ? <View style={styles.div} /> : null}
              <View style={styles.row}>
                <Text style={styles.label}>{RIGHT_LABELS[key]}</Text>
                {on ? (
                  <Check
                    size={m.toolIconSize}
                    color={colors.online}
                    accessibilityLabel={texts.rightAllowed}
                  />
                ) : (
                  <X
                    size={m.toolIconSize}
                    color={colors.textHint}
                    accessibilityLabel={texts.rightDenied}
                  />
                )}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}