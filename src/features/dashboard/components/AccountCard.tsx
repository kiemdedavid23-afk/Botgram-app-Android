import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {ShieldCheck, Calendar, Bot} from 'lucide-react-native';
import {useTheme, dashboardMetrics as dm} from '../../../shared/theme';
import {memberSince} from '../logic';
import {texts} from '../texts';

type Props = {
  createdAt: number | null;
  botCount: number;
};

export function AccountCard({
  createdAt,
  botCount,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const since =
    createdAt !== null ? memberSince(createdAt) : '–';

  const rows: {
    key: string;
    icon: React.ReactNode;
    label: string;
    value: string;
    badge?: boolean;
  }[] = [
    {
      key: 'type',
      icon: (
        <View
          style={[
            styles.iconBox,
            {backgroundColor: 'rgba(10,198,48,0.12)'},
          ]}>
          <ShieldCheck size={dm.accountIconSize} color="#0ac630" />
        </View>
      ),
      label: texts.accountType,
      value: texts.accountStandard,
      badge: true,
    },
    {
      key: 'since',
      icon: (
        <View
          style={[styles.iconBox, {backgroundColor: colors.accentSoft}]}>
          <Calendar size={dm.accountIconSize} color={colors.accent} />
        </View>
      ),
      label: texts.memberSince,
      value: since,
    },
    {
      key: 'bots',
      icon: (
        <View
          style={[styles.iconBox, {backgroundColor: colors.accentSoft}]}>
          <Bot size={dm.accountIconSize} color={colors.accent} />
        </View>
      ),
      label: texts.botsLinked,
      value: String(botCount),
    },
  ];

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.bgPrimary, borderColor: colors.border},
      ]}>
      {rows.map((row, i) => (
        <React.Fragment key={row.key}>
          {i > 0 ? (
            <View
              style={[styles.sep, {backgroundColor: colors.bgSecondary}]}
            />
          ) : null}
          <View style={styles.row}>
            {row.icon}
            <View style={styles.meta}>
              <Text style={[styles.key, {color: colors.textSecondary}]}>
                {row.label}
              </Text>
              <Text style={[styles.val, {color: colors.textPrimary}]}>
                {row.value}
              </Text>
            </View>
            {row.badge ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{texts.accountActive}</Text>
              </View>
            ) : null}
          </View>
        </React.Fragment>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: dm.botCardRadius,
    borderWidth: 1,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: dm.accountRowPadV,
    paddingHorizontal: dm.accountRowPadH,
    gap: dm.accountRowGap,
  },
  sep: {height: 1, marginHorizontal: 16},
  iconBox: {
    width: dm.accountIconBox,
    height: dm.accountIconBox,
    borderRadius: dm.accountIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  meta: {flex: 1},
  key: {fontSize: dm.accountKeySize},
  val: {fontSize: dm.accountValSize, fontWeight: '600'},
  badge: {
    borderRadius: 99,
    paddingVertical: 3,
    paddingHorizontal: 10,
    backgroundColor: 'rgba(10,198,48,0.12)',
  },
  badgeText: {
    color: '#0ac630',
    fontSize: 11,
    fontWeight: '700',
  },
});
