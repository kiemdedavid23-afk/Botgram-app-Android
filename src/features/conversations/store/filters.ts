import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

export type FolderId = 'all' | 'personal' | 'work' | 'unread' | 'archive';

type Slice = {
  items: ConversationSummary[];
  searchQuery: string;
  searchItems: ConversationSummary[];
  folder: FolderId;
};

/** ids archivés localement (clés du Record archiveStore). */
export function applyArchiveVisibility(
  list: ConversationSummary[],
  folder: FolderId,
  archivedIds: Record<string, true>,
): ConversationSummary[] {
  if (folder === 'archive') {
    return list.filter(c => !!archivedIds[c.id]);
  }
  return list.filter(c => !archivedIds[c.id]);
}

export function selectFilteredItems(s: Slice): ConversationSummary[] {
  if (s.searchQuery.trim().length >= 1) {
    return s.searchItems;
  }
  let list = s.items;
  switch (s.folder) {
    case 'personal':
      list = list.filter(c => c.chat_type === 'private');
      break;
    case 'work':
      list = list.filter(
        c => c.chat_type === 'group' || c.chat_type === 'channel',
      );
      break;
    case 'unread':
      list = list.filter(c => (c.unread_count ?? 0) > 0);
      break;
    case 'archive':
      // Visibilité archive appliquée dans l'écran (besoin des ids).
      break;
    default:
      break;
  }
  return list;
}

export function folderCounts(
  items: ConversationSummary[],
  archivedIds: Record<string, true> = {},
): Record<FolderId, number> {
  const visible = items.filter(c => !archivedIds[c.id]);
  return {
    all: visible.length,
    personal: visible.filter(c => c.chat_type === 'private').length,
    work: visible.filter(
      c => c.chat_type === 'group' || c.chat_type === 'channel',
    ).length,
    unread: visible.filter(c => (c.unread_count ?? 0) > 0).length,
    archive: items.filter(c => !!archivedIds[c.id]).length,
  };
}
