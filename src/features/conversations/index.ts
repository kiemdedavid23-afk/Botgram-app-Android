/** API publique feature conversations (L5b). */
export {ConversationsScreen} from './screens/ConversationsScreen';
export {
  useConversationsStore,
  selectFilteredItems,
  folderCounts,
  conversationTitle,
} from './store/conversationsStore';
export {conversationsTexts, formatConversationTime} from './texts';
