/**
 * Espace bot (release) — Échanges / Contacts / Paramètres / Profil.
 * Ouvert depuis le tableau de bord ou la feuille de bascule de l'en-tête.
 * Échanges : BotChatsStack (liste + fil). Les autres onglets restent des
 * écrans provisoires jusqu'à leur implémentation.
 * Retour à l'espace membre : photo de l'en-tête → membre, ou retour Android.
 */
import React, {useEffect, useState} from 'react';
import {View, StyleSheet, BackHandler} from 'react-native';
import {useTheme} from '../shared/theme';
import {BrandBar} from '../shared/components/BrandBar';
import {HeaderAvatarButton} from '../shared/components/HeaderAvatarButton';
import {
  BotBottomNav,
  type BotTabId,
} from '../shared/components/BotBottomNav';
import {EmptyScreen} from '../shared/components/EmptyScreen';
import {BotChatsStack} from '../features/conversations/navigation/BotChatsStack';
import {useConversationsStore} from '../features/conversations/store/conversationsStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {ContextSwitcher} from './ContextSwitcher';

type Props = {
  onExit: () => void;
};

const TAB_TITLES: Record<Exclude<BotTabId, 'chats'>, string> = {
  contacts: 'Contacts',
  settings: 'Paramètres',
  profile: 'Profil',
};

export function BotSpaceScreen({onExit}: Props): React.JSX.Element {
  const {colors} = useTheme();
  const [tab, setTab] = useState<BotTabId>('chats');
  const [switcherOpen, setSwitcherOpen] = useState(false);
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

  const headerRight = (
    <HeaderAvatarButton
      title={botName}
      open={switcherOpen}
      onPress={() => setSwitcherOpen(true)}
    />
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
      <EmptyScreen title={TAB_TITLES[tab]} subtitle="Bientôt disponible" />
      {nav}
      {switcher}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
});
