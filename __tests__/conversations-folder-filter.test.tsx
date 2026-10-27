/**
 * Régression : choisir Personnel / Travail / Non lus plantait l'app
 * (le sélecteur renvoyait un nouveau tableau à chaque lecture → boucle de rendu).
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {useShallow} from 'zustand/react/shallow';
import {
  useConversationsStore,
  selectFilteredItems,
} from '../src/features/conversations/store/conversationsStore';
import type {ConversationSummary} from '../src/core/api/endpoints/conversations';

jest.mock('../src/core/api/endpoints/conversations', () => ({
  listConversations: jest.fn(),
  getConversation: jest.fn(),
  searchConversations: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(() => Promise.resolve(undefined)),
  cacheSetString: jest.fn(() => Promise.resolve()),
  cacheDelete: jest.fn(() => Promise.resolve()),
  cacheDeleteByPrefix: jest.fn(() => Promise.resolve()),
}));

jest.mock('../src/core/utils/memberData', () => ({
  registerMemberDataCleaner: jest.fn(() => jest.fn()),
}));

function conv(
  id: string,
  chat_type: string,
  unread_count: number,
): ConversationSummary {
  return {id, chat_type, unread_count} as unknown as ConversationSummary;
}

function List(): React.JSX.Element {
  const filtered = useConversationsStore(useShallow(selectFilteredItems));
  return <Text testID="n">{String(filtered.length)}</Text>;
}

describe('filtre par dossier', () => {
  beforeEach(() => {
    useConversationsStore.setState({
      items: [conv('a', 'private', 2), conv('b', 'group', 0)],
      searchQuery: '',
      searchItems: [],
      folder: 'all',
    });
  });

  it.each([
    ['all', '2'],
    ['personal', '1'],
    ['work', '1'],
    ['unread', '1'],
  ] as const)('dossier %s affiche %s conversation(s) sans boucle', (folder, n) => {
    let tree!: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(<List />);
    });
    act(() => {
      useConversationsStore.getState().setFolder(folder);
    });
    expect(tree.root.findByProps({testID: 'n'}).props.children).toBe(n);
  });
});
