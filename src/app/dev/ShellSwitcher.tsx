/**
 * Sélecteur TEMPORAIRE (étape 1 uniquement).
 * À supprimer dès qu'une session réelle / bot actif existe.
 * Marqué explicitement comme code de développement.
 */
import React, {useCallback, useState} from 'react';
import {View, StyleSheet, Pressable, Text} from 'react-native';
import {useTheme, fontSize, fontWeight, space} from '../../shared/theme';
import {BrandBar} from '../../shared/components/BrandBar';
import {BottomNav, type MemberTabId} from '../../shared/components/BottomNav';
import {BotBottomNav, type BotTabId} from '../../shared/components/BotBottomNav';
import {EmptyScreen} from '../../shared/components/EmptyScreen';

export function ShellSwitcher(): React.JSX.Element {
  const {colors, mode, toggleTheme} = useTheme();
  const [spaceMode, setSpaceMode] = useState<'member' | 'bot'>('bot');

  const goMember = useCallback(() => setSpaceMode('member'), []);
  const goBot = useCallback(() => setSpaceMode('bot'), []);

  return (
    <View style={[styles.shell, {backgroundColor: colors.bgSecondary}]}>
      <BrandBar
        title="Botgram"
        right={
          <Pressable onPress={toggleTheme} hitSlop={space.iconButtonPadding}>
            <Text style={{color: colors.accent, fontSize: fontSize.listSubtitle}}>
              {mode === 'dark' ? 'Clair' : 'Sombre'}
            </Text>
          </Pressable>
        }
      />
      <View style={styles.switcher}>
        <Pressable
          onPress={goMember}
          style={[
            styles.switchBtn,
            {
              backgroundColor:
                spaceMode === 'member' ? colors.accentSoft : colors.bgTertiary,
            },
          ]}>
          <Text
            style={{
              color: spaceMode === 'member' ? colors.accent : colors.textSecondary,
              fontWeight: fontWeight.semibold,
              fontSize: fontSize.listName,
            }}>
            Espace membre
          </Text>
        </Pressable>
        <Pressable
          onPress={goBot}
          style={[
            styles.switchBtn,
            {
              backgroundColor:
                spaceMode === 'bot' ? colors.accentSoft : colors.bgTertiary,
            },
          ]}>
          <Text
            style={{
              color: spaceMode === 'bot' ? colors.accent : colors.textSecondary,
              fontWeight: fontWeight.semibold,
              fontSize: fontSize.listName,
            }}>
            Espace bot
          </Text>
        </Pressable>
      </View>
      {spaceMode === 'member' ? <MemberInner /> : <BotInner />}
    </View>
  );
}

function MemberInner(): React.JSX.Element {
  const [tab, setTab] = useState<MemberTabId>('dashboard');
  const titles: Record<MemberTabId, string> = {
    dashboard: 'Tableau de bord',
    member: 'Profil',
    settings: 'Paramètres',
  };
  return (
    <>
      <EmptyScreen title={titles[tab]} subtitle="Espace membre — étape 1" />
      <BottomNav activeTab={tab} onTabPress={setTab} visible />
    </>
  );
}

function BotInner(): React.JSX.Element {
  const [tab, setTab] = useState<BotTabId>('chats');
  const titles: Record<BotTabId, string> = {
    chats: 'Échanges',
    contacts: 'Contacts',
    settings: 'Paramètres',
    profile: 'Profil',
  };
  return (
    <>
      <EmptyScreen title={titles[tab]} subtitle="Espace bot — étape 1" />
      <BotBottomNav activeTab={tab} onTabPress={setTab} botName="Mon bot" visible />
    </>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
  },
  switcher: {
    flexDirection: 'row',
    gap: space.iconButtonPadding,
    paddingHorizontal: space.brandBarPaddingRight,
    paddingVertical: space.iconButtonPadding,
  },
  switchBtn: {
    flex: 1,
    paddingVertical: space.iconButtonPadding + 2,
    borderRadius: space.searchBarRadius,
    alignItems: 'center',
  },
});
