/**
 * Actions d'une conversation — source unique pour le menu ⋮ du fil
 * et la feuille d'appui long de la liste (mêmes actions, même ordre).
 */
import {Alert} from 'react-native';
import {
  UserRound,
  Pin,
  PinOff,
  Archive,
  ArchiveRestore,
  Trash2,
  type LucideIcon,
} from 'lucide-react-native';
import {conversationsTexts as ct} from '../texts';
import {threadTexts as tt} from '../../thread/texts';

export type ConversationMenuItem = {
  id: 'profile' | 'pin' | 'archive' | 'delete';
  label: string;
  Icon: LucideIcon;
  onPress: () => void;
  danger?: boolean;
  /** Grisé (ex. action serveur hors ligne). */
  disabled?: boolean;
};

type Options = {
  pinned: boolean;
  archived: boolean;
  /** Épingler / supprimer passent par le serveur. */
  offline?: boolean;
  onViewProfile?: () => void;
  onTogglePin: () => void;
  onToggleArchive: () => void;
  onDelete: () => void;
};

/** Groupes : Contact · Organisation · Zone dangereuse. */
export function buildConversationMenu(o: Options): ConversationMenuItem[][] {
  const groups: ConversationMenuItem[][] = [];
  if (o.onViewProfile) {
    groups.push([
      {
        id: 'profile',
        label: tt.menuViewProfile,
        Icon: UserRound,
        onPress: o.onViewProfile,
      },
    ]);
  }
  groups.push([
    {
      id: 'pin',
      label: o.pinned ? ct.unpinAction : ct.pinAction,
      Icon: o.pinned ? PinOff : Pin,
      onPress: o.onTogglePin,
      disabled: !!o.offline,
    },
    {
      id: 'archive',
      label: o.archived ? ct.unarchiveAction : ct.archiveAction,
      Icon: o.archived ? ArchiveRestore : Archive,
      onPress: o.onToggleArchive,
    },
  ]);
  groups.push([
    {
      id: 'delete',
      label: ct.deleteConversation,
      Icon: Trash2,
      onPress: o.onDelete,
      danger: true,
      disabled: !!o.offline,
    },
  ]);
  return groups;
}

/** Double confirmation de suppression (identique partout). */
export function confirmDeleteConversation(onConfirm: () => void): void {
  Alert.alert(
    ct.deleteConversationConfirmTitle,
    ct.deleteConversationConfirmBody,
    [
      {text: ct.cancel, style: 'cancel'},
      {
        text: ct.deleteConversationConfirm2,
        style: 'destructive',
        onPress: onConfirm,
      },
    ],
  );
}

/** @username sinon Privé / Groupe / Canal. */
export function conversationSubtitle(
  c: {chat_type?: string; username?: string | null} | undefined,
): string | null {
  if (!c) return null;
  if (c.username) return `@${c.username}`;
  switch (c.chat_type) {
    case 'private':
      return tt.chatPrivate;
    case 'group':
      return tt.chatGroup;
    case 'channel':
      return tt.chatChannel;
    default:
      return null;
  }
}
