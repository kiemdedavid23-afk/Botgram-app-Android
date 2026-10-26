/**
 * Section Session profil — Se déconnecter / Supprimer le compte.
 * Même habillage que les lignes du profil : pastille d'icône arrondie,
 * séparateur en retrait. « Supprimer » reste en rouge.
 */
import React from 'react';
import {View, Text, Pressable, StyleSheet} from 'react-native';
import {LogOut, Trash2} from 'lucide-react-native';
import {
  useTheme,
  memberProfileMetrics as m,
  getShadow,
} from '../../../shared/theme';
import {texts} from '../texts';

type Props = {
  onLogout: () => void;
  onDelete: () => void;
};

export function ProfileSessionSection({
  onLogout,
  onDelete,
}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
        {texts.sectionSession}
      </Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.bgPrimary,
            borderColor: colors.borderSoft,
          },
          getShadow('sm', mode),
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={onLogout}
          style={({pressed}) => [
            styles.action,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <View style={[styles.icon, {backgroundColor: colors.accentSoft}]}>
            <LogOut size={18} color={colors.accent} />
          </View>
          <Text style={[styles.actionText, {color: colors.textPrimary}]}>
            {texts.logout}
          </Text>
        </Pressable>
        <View style={[styles.sep, {backgroundColor: colors.bgSecondary}]} />
        <Pressable
          accessibilityRole="button"
          onPress={onDelete}
          style={({pressed}) => [
            styles.action,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <View style={[styles.icon, {backgroundColor: colors.rowIconDangerBg}]}>
            <Trash2 size={18} color={colors.danger} />
          </View>
          <Text style={[styles.actionText, {color: colors.danger}]}>
            {texts.deleteAccount}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {gap: m.sectionTitleGap},
  sectionTitle: {
    fontSize: m.sectionTitleSize,
    fontWeight: '700',
    letterSpacing: m.sectionTitleLetter * m.sectionTitleSize,
    textTransform: 'uppercase',
    paddingHorizontal: m.sectionTitlePadH,
  },
  card: {borderRadius: m.cardRadius, borderWidth: 1, overflow: 'hidden'},
  action: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: m.rowGap,
    paddingVertical: m.rowPadV,
    paddingHorizontal: m.rowPadH,
  },
  icon: {
    width: m.rowIcon,
    height: m.rowIcon,
    borderRadius: m.rowIconRadius,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: {fontSize: m.rowValSize, fontWeight: '600'},
  sep: {height: 1, marginHorizontal: 16},
});
