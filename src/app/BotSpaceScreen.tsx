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
import React, {useEffect, useMemo, useState} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {
  LayoutDashboard,
  Moon,
  Sun,
  ArrowLeftRight,
  CheckCheck,
  Mail,
  ListChecks,
} from 'lucide-react-native';
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
import {useSelectionStore} from '../features/conversations/store/selectionStore';
import {markAllConversationsRead} from '../features/conversations/store/bulkActions';
import {conversationsTexts as ct} from '../features/conversations/texts';
import {fireAndForget} from '../core/utils/fireAndForget';
import {useBotsStore} from '../features/bots/store/botsStore';
import {BotSettingsStack} from '../features/settings';
import {BotProfileScreen} from '../features/botprofile';
import {BotfactorScreen, useBotfactorLauncher} from '../features/botfactor';
import {ContextSwitcher} from './ContextSwitcher';

type Props = {
  /** Retour à l'espace membre. */
  onExit: () => void;
  /** Ouvre le parcours d'ajout de bot (depuis le profil du bot). */
  onAddBot: () => void;
};

const BOT_MENU: ReadonlyArray<HeaderMenuItem<'member'>> = [
  {id: 'member', label: 'Espace membre', Icon: LayoutDashboard},
];

type ChatsMenuId =
  | 'member'
  | 'theme'
  | 'switchBot'
  | 'markAllRead'
  | 'unreadOnly'
  | 'select';

export function BotSpaceScreen({onExit, onAddBot}: Props): React.JSX.Element {
  const {colors, mode, appearance, setAppearance} = useTheme();
  const folder = useConversationsStore(s => s.folder);
  const setFolder = useConversationsStore(s => s.setFolder);
  const chatsOffline = useConversationsStore(s => s.offline);
  const enterSelection = useSelectionStore(s => s.enter);
  const [tab, setTab] = useState<BotTabId>('chats');
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const factorOpen = useBotfactorLauncher(s => s.open);
  const closeFactor = useBotfactorLauncher(s => s.close);
  const openFactor = useBotfactorLauncher(s => s.openWith);
  const unreadBadge = useConversationsStore(s => s.unreadTotal);
  const bots = useBotsStore(s => s.bots);
  const selected = bots.find(b => b.selected) ?? bots[0];
  const botName = selected?.name ?? 'Bot';

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


  // Menu ⋮ de l'onglet Échanges : actions de la liste + espace membre, thème, changement de bot.
  const dark = mode === 'dark';
  const chatsMenu = useMemo<ReadonlyArray<HeaderMenuItem<ChatsMenuId>>>(
    () => [
      {id: 'member', label: ct.memberSpace, Icon: LayoutDashboard},
      {
        id: 'theme',
        label: dark ? ct.themeDay : ct.themeNight,
        Icon: dark ? Sun : Moon,
      },
      {id: 'switchBot', label: ct.switchBot, Icon: ArrowLeftRight},
      {id: 'markAllRead', label: ct.markAllRead, Icon: CheckCheck},
      {
        id: 'unreadOnly',
        label: folder === 'unread' ? ct.allChats : ct.unreadOnly,
        Icon: Mail,
      },
      {id: 'select', label: ct.selectAction, Icon: ListChecks},
    ],
    [dark, folder],
  );

  const onChatsMenu = (id: ChatsMenuId) => {
    switch (id) {
      case 'member':
        onExit();
        break;
      case 'theme':
        setAppearance({
          ...appearance,
          followSystemTheme: false,
          theme: dark ? 'light' : 'dark',
        });
        break;
      case 'switchBot':
        setSwitcherOpen(true);
        break;
      case 'markAllRead':
        if (!chatsOffline) fireAndForget(markAllConversationsRead());
        break;
      case 'unreadOnly':
        setFolder(folder === 'unread' ? 'all' : 'unread');
        break;
      case 'select':
        enterSelection();
        break;
    }
  };

  const avatarButton = (
    <HeaderAvatarButton
      title={botName}
      showAvatar={false}
      open={switcherOpen}
      onPress={() => setSwitcherOpen(true)}
    />
  );

  const headerRightChats = (
    <View style={styles.headerRight}>
      {avatarButton}
      <HeaderMenu items={chatsMenu} activeId={null} onSelect={onChatsMenu} />
    </View>
  );

  const headerRight = (
    <View style={styles.headerRight}>
      {avatarButton}
      <HeaderMenu items={BOT_MENU} activeId={null} onSelect={onExit} />
    </View>
  );

  const nav = (
    <BotBottomNav
      activeTab={tab}
      onTabPress={setTab}
      botName={botName}
      botId={selected?.id}
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

  const content =
    tab === 'chats' ? (
      <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
        <BotChatsStack footer={nav} headerRight={headerRightChats} />
        {switcher}
      </View>
    ) : (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <BrandBar title="Botgram" right={headerRight} />
      {tab === 'settings' ? (
        <View style={styles.settingsBody}>
          <BotSettingsStack />
        </View>
      ) : tab === 'profile' ? (
        <BotProfileScreen
          onAddBot={onAddBot}
          onOpenBotfactor={() => openFactor()}
        />
      ) : (
        <EmptyScreen title="Contacts" subtitle="Bientôt disponible" />
      )}
      {nav}
      {switcher}
    </View>
    );

  return (
    <View style={styles.root}>
      {content}
      {factorOpen ? (
        <View
          style={[StyleSheet.absoluteFill, {backgroundColor: colors.bgSecondary}]}>
          <BotfactorScreen onBack={closeFactor} />
        </View>
      ) : null}
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
