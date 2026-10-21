/**
 * Onglet Paramètres membre — MemberSettingsPage.tsx + settings-list.css.
 * Documentation absente de l'app → non créée (signalée LIVRAISONS).
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet, ScrollView} from 'react-native';
import {UserRound, LogOut} from 'lucide-react-native';
import {
  useTheme,
  settingsMetrics as sm,
  getShadow,
} from '../../../shared/theme';
import {useAuthStore} from '../../auth';
import {texts} from '../texts';
import {fireAndForget} from '../../../core/utils/fireAndForget';

type Props = {
  onGoProfile: () => void;
};

export function MemberSettingsScreen({
  onGoProfile,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  const signOut = useAuthStore(s => s.signOut);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View
          style={[
            styles.card,
            {backgroundColor: colors.bgPrimary},
            getShadow('sm', mode),
          ]}>
          <Pressable
            onPress={onGoProfile}
            style={({pressed}) => [
              styles.row,
              pressed && {backgroundColor: colors.bgSecondary},
            ]}>
            <View
              style={[
                styles.icon,
                {backgroundColor: colors.settingsIconProfile},
              ]}>
              <UserRound size={sm.iconInner} color={colors.white} />
            </View>
            <View style={styles.labels}>
              <Text style={[styles.title, {color: colors.textPrimary}]}>
                {texts.myProfile}
              </Text>
              <Text style={[styles.sub, {color: colors.textSecondary}]}>
                {texts.myProfileSub}
              </Text>
            </View>
          </Pressable>

          <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />

          <Pressable
            onPress={() => {
              fireAndForget(signOut());
            }}
            style={({pressed}) => [
              styles.row,
              pressed && {backgroundColor: colors.bgSecondary},
            ]}>
            <View
              style={[
                styles.icon,
                {backgroundColor: colors.settingsIconLogout},
              ]}>
              <LogOut size={sm.iconInner} color={colors.white} />
            </View>
            <View style={styles.labels}>
              <Text style={[styles.title, {color: colors.textPrimary}]}>
                {texts.logout}
              </Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  content: {
    paddingTop: sm.cardMarginTop,
    paddingBottom: 32,
  },
  card: {
    marginHorizontal: sm.cardMarginH,
    marginBottom: sm.cardMarginBottom,
    borderRadius: sm.cardRadius,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sm.rowGap,
    paddingVertical: sm.rowPadV,
    paddingHorizontal: sm.rowPadH,
  },
  icon: {
    width: sm.iconSize,
    height: sm.iconSize,
    borderRadius: sm.iconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labels: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontSize: sm.titleSize,
    fontWeight: sm.titleWeight,
  },
  sub: {
    fontSize: sm.subSize,
  },
  sep: {
    height: 1,
    marginLeft: sm.rowPadH + sm.iconSize + sm.rowGap,
  },
});
