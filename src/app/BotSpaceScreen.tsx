/**
 * Espace bot (release) — Échanges / Contacts / Paramètres / Profil.
 * Ouvert depuis le tableau de bord ou la feuille de bascule de l'en-tête.
 *
 * En-tête commun (photo du bot + menu ⋮ « Espace membre ») sur Échanges,
 * Paramètres et Profil du bot.
 * - Échanges : BotChatsStack (liste + fil).
 * - Contacts : écran provisoire.
 * - Paramètres : page Paramètres actuelle (refonte à venir).
 * - Profil : profil Telegram du bot.
 */
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {LayoutDashboard} from 'lucide-react-native';
import {useTheme, space} from '../shared/theme';
import {BrandBar} from '../shared/components/BrandBar';
import {HeaderAvatarButton} from '../shared/components/HeaderAvatarButton';
import {
  HeaderMenu,
  type HeaderMenuItem,
} from '../shared/components/HeaderMenu';
import {
  BotBottomNav,
  type BotTabId,
} from '../shared/components/BotBottomNav';
import {EmptyScreen} from '../shared/components/EmptyScreen';
import {BotChatsStack} from '../features/conversations/navigation/BotChatsStack';
import {useConversationsStore} from '../features/conversations/store/conversationsStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {MemberSettingsScreen} from '../features/settings';
import {BotProfileScreen} from '../features/botprofile';
import {ContextSwitcher} from './ContextSwitcher';
import {useMemberSectionStore} from './memberSectionStore';

type Props = {
  /** Retour à l'espace membre. */
  onExit: () => void;
  /** Ouvre le parcours d'ajout de bot (depuis le profil du bot). */
  onAddBot: () => void;
};

const BOT_MENU: ReadonlyArray<HeaderMenuItem<'member'>> = [
  {id: 'member', label: 'Espace membre', Icon: LayoutDashboard},
];

export function BotSpaceScreen({onExit, onAddBot}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [tab, setTab] = useState<BotTabId>('chats');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const unreadBadge = useConversationsStore(s => s.unreadTotal);
  const bots = useBotsStore(s => s.bots);
  const selected = bots.find(b => b.selected) ?? bots[0];
  const botName = selected?.name ?? 'Bot';
  const setMemberSection = useMemberSectionStore(s => s.setSection);

  // Retour Android depuis un onglet secondaire → revient sur Échanges.
  // (Le fil ouvert dans BotChatsStack gère déjà son propre retour.)
  useEffect(() => {
    if (tab === 'chats') {
      return undefined;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setTab('chats');
      return true;
    });
    return () => {
      sub.remove();
    };
  }, [tab]);

  const goMember = (section: 'member' | 'gestion'): void => {
    setMemberSection(section);
    onExit();
  };

  const headerRight = (
    <View style={styles.headerRight}>
      <HeaderAvatarButton
        title={botName}
        open={switcherOpen}
        onPress={() => setSwitcherOpen(true)}
      />
      <HeaderMenu items={BOT_MENU} activeId={null} onSelect={onExit} />
    </View>
  );

  const nav = (
    <BotBottomNav
      activeTab={tab}
      onTabPress={setTab}
      botName={botName}
      unreadBadge={unreadBadge}
      visible
    />
  );

  const switcher = (
    <ContextSwitcher
      context="bot"
      visible={switcherOpen}
      onClose={() => setSwitcherOpen(false)}
      onSelectMember={() => {
        setSwitcherOpen(false);
        onExit();
      }}
      onBotSelected={() => setSwitcherOpen(false)}
    />
  );

  if (tab === 'chats') {
    return (
      <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
        <BotChatsStack footer={nav} headerRight={headerRight} />
        {switcher}
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <BrandBar title="Botgram" right={headerRight} />
      {tab === 'settings' ? (
        // La page Paramètres n'a pas de marge basse pour la barre flottante.
        <View style={styles.settingsBody}>
          <MemberSettingsScreen
            onGoProfile={() => goMember('member')}
            onGoGestion={() => goMember('gestion')}
            onGoBotProfile={() => setTab('profile')}
          />
        </View>
      ) : tab === 'profile' ? (
        <BotProfileScreen onAddBot={onAddBot} />
      ) : (
        <EmptyScreen title="Contacts" subtitle="Bientôt disponible" />
      )}
      {nav}
      {switcher}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  settingsBody: {flex: 1, paddingBottom: space.bottomNavZone},
});
