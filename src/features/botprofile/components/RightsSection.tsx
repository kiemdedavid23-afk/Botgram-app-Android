/** Droits — site RightsSection + .bp-switch (BotProfile.css) */
import React, {useState} from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {useTheme, botProfileMetrics as m} from '../../../shared/theme';
import type {
  AdminRightKey,
  AdminRights,
  BotProfile,
} from '../../../core/api/endpoints/botProfile.types';
import {ADMIN_RIGHT_KEYS} from '../../../core/api/endpoints/botProfile.types';
import {RIGHT_LABELS, RIGHT_SCOPE} from '../utils/labels';
import {texts} from '../texts';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';

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

export function RightsSection({
  draft,
  onToggle,
  onSetAll,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const reduce = useReducedMotion();
  const [target, setTarget] = useState<Target>('groups');
  const rights: AdminRights = draft.admin_rights[target];
  const keys = keysFor(target);

  return (
    <View style={styles.root}>
      <Text style={[styles.title, {color: colors.textPrimary}]}>
        {texts.rightsTitle}
      </Text>
      <View style={styles.tabs}>
        {(['groups', 'channels'] as const).map(t => {
          const on = t === target;
          return (
            <Pressable
              key={t}
              onPress={() => setTarget(t)}
              style={[
                styles.tab,
                {
                  backgroundColor: on ? colors.accent : colors.bgPrimary,
                  borderColor: colors.border,
                },
              ]}>
              <Text
                style={{
                  color: on ? '#fff' : colors.textSecondary,
                  fontWeight: '600',
                  fontSize: 13,
                }}>
                {t === 'groups' ? texts.rightsGroups : texts.rightsChannels}
              </Text>
            </Pressable>
          );
        })}
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => onSetAll(target, true)}
          style={[styles.btn, {backgroundColor: colors.accentSoft}]}>
          <Text style={{color: colors.accent, fontWeight: '600'}}>
            {texts.rightsAll}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onSetAll(target, false)}
          style={[styles.btn, {backgroundColor: colors.bgSecondary}]}>
          <Text style={{color: colors.textSecondary, fontWeight: '600'}}>
            {texts.rightsNone}
          </Text>
        </Pressable>
      </View>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary, borderColor: colors.border},
        ]}>
        {keys.map((key, i) => {
          const on = rights[key] === true;
          return (
            <View key={key}>
              {i > 0 ? (
                <View style={[styles.div, {backgroundColor: colors.border}]} />
              ) : null}
              <View style={styles.row}>
                <Text style={[styles.label, {color: colors.textPrimary}]}>
                  {RIGHT_LABELS[key]}
                </Text>
                <Pressable
                  onPress={() => onToggle(target, key, !on)}
                  accessibilityRole="switch"
                  accessibilityState={{checked: on}}
                  style={[
                    styles.sw,
                    {backgroundColor: on ? colors.accent : colors.bgTertiary},
                  ]}>
                  <View
                    style={[
                      styles.knob,
                      {
                        transform: [{translateX: on ? m.knobTravel : 0}],
                      },
                      reduce ? undefined : undefined,
                    ]}
                  />
                </Pressable>
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {paddingBottom: 6},
  title: {
    fontSize: m.titleFontSize,
    fontWeight: m.titleFontWeight,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
  },
  tabs: {flexDirection: 'row', gap: 8, paddingHorizontal: 16, marginBottom: 12},
  tab: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 99,
    borderWidth: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 16,
    borderWidth: 1,
    overflow: 'hidden',
  },
  div: {height: StyleSheet.hairlineWidth, marginLeft: 16},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: m.rowPaddingV,
    paddingHorizontal: m.rowPaddingH,
    gap: 12,
  },
  label: {flex: 1, fontSize: 15, fontWeight: '500'},
  sw: {
    width: m.switchWidth,
    height: m.switchHeight,
    borderRadius: 99,
    justifyContent: 'center',
  },
  knob: {
    position: 'absolute',
    top: m.knobOffset,
    left: m.knobOffset,
    width: m.knobSize,
    height: m.knobSize,
    borderRadius: m.knobSize / 2,
    backgroundColor: '#fff',
  },
});
