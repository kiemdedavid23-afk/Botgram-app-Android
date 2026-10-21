/**
 * Écran Profil membre — MemberProfilePage.tsx + .css.
 * Onglet Profil (BottomNav). Édition + suppression câblées au store.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, ScrollView, StyleSheet, Animated} from 'react-native';
import {useTheme, memberProfileMetrics as m} from '../../../shared/theme';
import {useReducedMotion} from '../../../shared/hooks/useReducedMotion';
import {useAuthStore} from '../../auth';
import {useMemberStore} from '../store/memberStore';
import {useBotsStore} from '../../bots';
import {ProfileHero} from '../components/ProfileHero';
import {ProfileSections} from '../components/ProfileSections';
import {EditProfileSheet} from '../components/EditProfileSheet';
import {DeleteAccountDialog} from '../components/DeleteAccountDialog';

type Props = {
  onGoDashboard?: () => void;
};

export function MemberProfileScreen({
  onGoDashboard,
}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const reduce = useReducedMotion();
  const authMember = useAuthStore(s => s.member);
  const setMember = useMemberStore(s => s.setMember);
  const member = useMemberStore(s => s.member) ?? authMember;
  const signOut = useAuthStore(s => s.signOut);
  const bots = useBotsStore(s => s.bots);

  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (authMember) setMember(authMember);
  }, [authMember, setMember]);

  const fade = React.useRef(new Animated.Value(reduce ? 1 : 0)).current;
  useEffect(() => {
    if (reduce) return;
    Animated.timing(fade, {
      toValue: 1,
      duration: m.itemRiseMs,
      useNativeDriver: true,
    }).start();
  }, [fade, reduce]);

  if (!member) {
    return (
      <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
        <Text style={{color: colors.textSecondary, padding: 24}}>—</Text>
      </View>
    );
  }

  const defaultBot = bots.find(b => b.id === member.selected_bot_id);

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}>
        <Animated.View style={{opacity: fade}}>
          <ProfileHero
            displayName={member.display_name}
            status={member.status}
            emailVerified={member.email_verified}
          />
        </Animated.View>
        <ProfileSections
          member={member}
          defaultBot={defaultBot}
          onEdit={() => setEditing(true)}
          onGoDashboard={onGoDashboard}
          onLogout={() => {
            void signOut();
          }}
          onDelete={() => setDeleting(true)}
        />
      </ScrollView>

      <EditProfileSheet
        visible={editing}
        onClose={() => setEditing(false)}
      />
      <DeleteAccountDialog
        visible={deleting}
        email={member.email}
        onClose={() => setDeleting(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  scroll: {
    paddingHorizontal: m.scrollPadH,
    paddingTop: m.scrollPadTop,
    paddingBottom: m.scrollPadBottom,
    gap: m.sectionGap,
  },
});
