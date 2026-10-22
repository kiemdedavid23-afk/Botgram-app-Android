/**
 * Section Session profil — Se déconnecter / Supprimer.
 */
import React from \'react\';
import {View, Text, Pressable, StyleSheet} from \'react-native\';
import {LogOut, Trash2} from \'lucide-react-native\';
import {useTheme, memberProfileMetrics as m, getShadow} from \'../../../shared/theme\';
import {texts} from \'../texts\';

type Props = {
  onLogout: () => void;
  onDelete: () => void;
};

export function ProfileSessionSection({onLogout, onDelete}: Props): React.JSX.Element {
  const {colors, mode} = useTheme();
  return (
    <View style={styles.section}>
      <Text style={[styles.sectionTitle, {color: colors.textHint}]}>
        {texts.sectionSession}
      </Text>
      <View
        style={[
          styles.card,
          {backgroundColor: colors.bgPrimary},
          getShadow(\'sm\', mode),
        ]}>
        <Pressable
          onPress={onLogout}
          style={({pressed}) => [
            styles.action,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <LogOut size={18} color={colors.danger} />
          <Text style={[styles.actionText, {color: colors.danger}]}>
            {texts.logout}
          </Text>
        </Pressable>
        <View style={[styles.sep, {backgroundColor: colors.borderSoft}]} />
        <Pressable
          onPress={onDelete}
          style={({pressed}) => [
            styles.action,
            pressed && {backgroundColor: colors.bgSecondary},
          ]}>
          <Trash2 size={18} color={colors.danger} />
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
    fontWeight: \'700\',
    letterSpacing: m.sectionTitleLetter * m.sectionTitleSize,
    textTransform: \'uppercase\',
    paddingHorizontal: m.sectionTitlePadH,
  },
  card: {borderRadius: m.cardRadius, overflow: \'hidden\'},
  action: {
    flexDirection: \'row\',
    alignItems: \'center\',
    gap: 12,
    paddingVertical: m.rowPadV,
    paddingHorizontal: m.rowPadH,
  },
  actionText: {fontSize: 15, fontWeight: \'600\'},
  sep: {height: 1, marginLeft: m.rowPadH},
});
