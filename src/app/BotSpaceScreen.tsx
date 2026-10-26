/**
 * Espace bot (release) — Échanges / Contacts / Paramètres / Profil.
 * Ouvert depuis le tableau de bord après sélection d'un bot.
 * Échanges : BotChatsStack (liste + fil). Les autres onglets restent des
 * écrans provisoires jusqu'à leur implémentation.
 * Retour : bouton « Tableau de bord » (onglets provisoires) ou retour Android.
 */
import React, {useEffect, useState} from 'react';
import {View, Text, Pressable, StyleSheet, BackHandler} from 'react-native';
import {ArrowLeft} from 'lucide-react-native';
import {useTheme, fontSize, fontWeight, space} from '../shared/theme';
import {
  BotBottomNav,
  type BotTabId,
} from '../shared/components/BotBottomNav';
import {EmptyScreen} from '../shared/components/EmptyScreen';
import {BotChatsStack} from '../features/conversations/navigation/BotChatsStack';
import {useConversationsStore} from '../features/conversations/store/conversationsStore';
import {useBotsStore} from '../features/bots/store/botsStore';

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

  const nav = (
    <BotBottomNav
      activeTab={tab}
      onTabPress={setTab}
      botName={botName}
      unreadBadge={unreadBadge}
      visible
    />
  );

  if (tab === 'chats') {
    return (
      <View style={[styles.root, {backgroundColor: colors.bgPrimary}]}>
        <BotChatsStack footer={nav} />
      </View>
    );
  }

  return (
    <View style={[styles.root, {backgroundColor: colors.bgSecondary}]}>
      <Pressable
        accessibilityRole="button"
        onPress={onExit}
        hitSlop={space.iconButtonPadding}
        style={styles.exit}>
        <ArrowLeft size={20} color={colors.accent} />
        <Text style={[styles.exitText, {color: colors.accent}]}>
          Tableau de bord
        </Text>
      </Pressable>
      <EmptyScreen title={TAB_TITLES[tab]} subtitle="Bientôt disponible" />
      {nav}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {flex: 1},
  exit: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.iconButtonPadding,
    paddingHorizontal: space.brandBarPaddingRight,
    paddingVertical: space.iconButtonPadding,
  },
  exitText: {
    fontSize: fontSize.listName,
    fontWeight: fontWeight.semibold,
  },
});
