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
  const since = createdAt !== null ? memberSince(createdAt) : '–';

  return (
    <View
      style={[
        styles.card,
        {backgroundColor: colors.bgPrimary, borderColor: colors.border},
      ]}>
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: colors.onlineSoft}]}>
          <ShieldCheck size={dm.accountIconSize} color={colors.online} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.key, {color: colors.textSecondary}]}>
            {texts.accountType}
          </Text>
          <Text style={[styles.val, {color: colors.textPrimary}]}>
            {texts.accountStandard}
          </Text>
        </View>
        <View style={[styles.badge, {backgroundColor: colors.onlineSoft}]}>
          <Text style={[styles.badgeText, {color: colors.online}]}>
            {texts.accountActive}
          </Text>
        </View>
      </View>
      <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: colors.accentSoft}]}>
          <Calendar size={dm.accountIconSize} color={colors.accent} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.key, {color: colors.textSecondary}]}>
            {texts.memberSince}
          </Text>
          <Text style={[styles.val, {color: colors.textPrimary}]}>{since}</Text>
        </View>
      </View>
      <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
      <View style={styles.row}>
        <View style={[styles.iconBox, {backgroundColor: colors.accentSoft}]}>
          <Bot size={dm.accountIconSize} color={colors.accent} />
        </View>
        <View style={styles.meta}>
          <Text style={[styles.key, {color: colors.textSecondary}]}>
            {texts.botsLinked}
          </Text>
          <Text style={[styles.val, {color: colors.textPrimary}]}>
            {String(botCount)}
          </Text>
        </View>
      </View>
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
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
});
