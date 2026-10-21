/**
 * Section Appareils connectés — GestionPage.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ActivityIndicator} from 'react-native';
import {Smartphone, Monitor} from 'lucide-react-native';
import {useTheme, gestionMetrics as g, getShadow} from '../../../shared/theme';
import type {Session} from '../../../core/api/endpoints/sessions';
import {texts} from '../texts';
import {timeAgo, shortDate, isMobileDevice} from '../utils/format';

type Props = {
  sessions: Session[];
  loading: boolean;
  onRevoke: (id: string) => void;
  onLogoutAll: () => void;
};

export function DevicesSection({
  sessions,
  loading,
  onRevoke,
  onLogoutAll,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
        {texts.sectionDevices}
      </Text>
      {loading && !sessions.length ? (
        <ActivityIndicator color={colors.accent} />
      ) : (
        sessions.map(s => {
          const Icon = isMobileDevice(s.device) ? Smartphone : Monitor;
          return (
            <View
              key={s.id}
              style={[
                styles.session,
                {
                  backgroundColor: colors.bgPrimary,
                  borderColor: colors.borderSoft,
                },
                getShadow('sm', mode),
              ]}>
              <View
                style={[styles.sessionIcon, {backgroundColor: colors.accentSoft}]}>
                <Icon size={20} color={colors.accent} />
              </View>
              <View style={styles.sessionMeta}>
                <Text
                  style={[styles.sessionDevice, {color: colors.textPrimary}]}
                  numberOfLines={1}>
                  {s.device}
                </Text>
                <Text style={[styles.metaLine, {color: colors.textSecondary}]}>
                  {texts.createdAt} {shortDate(s.created_at)} · {texts.lastActive}{' '}
                  {timeAgo(s.last_active_at)}
                </Text>
                {s.current ? (
                  <View
                    style={[styles.badge, {backgroundColor: colors.accentSoft}]}>
                    <Text style={[styles.badgeText, {color: colors.accent}]}>
                      {texts.badgeCurrent}
                    </Text>
                  </View>
                ) : null}
              </View>
              {!s.current ? (
                <Pressable onPress={() => onRevoke(s.id)}>
                  <Text style={[styles.revoke, {color: colors.danger}]}>
                    {texts.revokeDevice}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          );
        })
      )}
      <Pressable
        onPress={onLogoutAll}
        style={[styles.logoutAll, {backgroundColor: colors.dangerSoft}]}>
        <Text style={[styles.logoutAllText, {color: colors.danger}]}>
          {texts.logoutAll}
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: 10},
  sectionTitle: {
    fontSize: g.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: g.sectionTitleLetter * g.sectionTitleSize,
    textTransform: 'uppercase',
    paddingHorizontal: g.sectionHeadPadH,
  },
  session: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: g.cardPad,
    borderRadius: g.cardRadius,
    borderWidth: 1,
  },
  sessionIcon: {
    width: g.sessionIcon,
    height: g.sessionIcon,
    borderRadius: g.sessionIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionMeta: {flex: 1, gap: 2},
  sessionDevice: {fontWeight: '600', fontSize: 15},
  badge: {
    alignSelf: 'flex-start',
    borderRadius: 99,
    paddingVertical: 2,
    paddingHorizontal: 8,
    marginTop: 2,
  },
  logoutAll: {
    padding: g.cardPad,
    borderRadius: g.cardRadius,
    alignItems: 'center',
  },
  metaLine: {fontSize: g.metaFont},
  badgeText: {fontSize: g.badgeFont, fontWeight: '700'},
  revoke: {fontWeight: '600'},
  logoutAllText: {fontWeight: '700'},
});
