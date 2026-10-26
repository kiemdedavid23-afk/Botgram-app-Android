/**
 * Feuille de bascule membre / bots reliée aux stores.
 * Utilisée par l'en-tête de l'espace membre et celui de l'espace bot.
 */
import React from 'react';
import {AccountSwitcherSheet} from '../shared/components/AccountSwitcherSheet';
import {useAuthStore} from '../features/auth/store/authStore';
import {useBotsStore} from '../features/bots/store/botsStore';
import {fireAndForget} from '../core/utils/fireAndForget';

type Props = {
  context: 'member' | 'bot';
  visible: boolean;
  onClose: () => void;
  onSelectMember: () => void;
  /** Appelé une fois le bot sélectionné avec succès. */
  onBotSelected: (id: string) => void;
};

export function ContextSwitcher({
  context,
  visible,
  onClose,
  onSelectMember,
  onBotSelected,
}: Props): React.JSX.Element {
  const member = useAuthStore(s => s.member);
  const bots = useBotsStore(s => s.bots);
  const selectBot = useBotsStore(s => s.select);

  const activeBotId = (bots.find(b => b.selected) ?? bots[0])?.id ?? null;

  const onSelectBot = (id: string): void => {
    if (context === 'bot' && id === activeBotId) {
      onClose();
      return;
    }
    fireAndForget(
      selectBot(id).then(res => {
        if (res.ok) {
          onBotSelected(id);
        }
      }),
    );
  };

  return (
    <AccountSwitcherSheet
      visible={visible}
      onClose={onClose}
      context={context}
      memberName={member?.display_name ?? ''}
      memberEmail={member?.email ?? ''}
      bots={bots.map(b => ({
        id: b.id,
        name: b.name,
        connected: b.status === 'connected',
      }))}
      activeBotId={activeBotId}
      onSelectMember={onSelectMember}
      onSelectBot={onSelectBot}
    />
  );
}
