import type {ConversationSummary} from '../../../core/api/endpoints/conversations';

export type FolderId = 'all' | 'personal' | 'work' | 'unread';

type Slice = {
  items: ConversationSummary[];
  searchQuery: string;
  searchItems: ConversationSummary[];
  folder: FolderId;
};

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
    default:
      break;
  }
  return list;
}

export function folderCounts(
  items: ConversationSummary[],
): Record<FolderId, number> {
  return {
    all: items.length,
    personal: items.filter(c => c.chat_type === 'private').length,
    work: items.filter(
      c => c.chat_type === 'group' || c.chat_type === 'channel',
    ).length,
    unread: items.filter(c => (c.unread_count ?? 0) > 0).length,
  };
}
