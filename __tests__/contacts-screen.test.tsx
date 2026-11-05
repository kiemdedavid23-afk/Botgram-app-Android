/**
 * Étape 7 — onglet Contacts : liste, recherche, ouverture, introuvable, erreur.
 */
import React from 'react';
import {Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {ContactsScreen} from '../src/features/contacts/screens/ContactsScreen';
import {useContactsStore} from '../src/features/contacts/store/contactsStore';
import {listContacts, searchContacts} from '../src/core/api/endpoints/contacts';
import {findConversationForContact} from '../src/features/contacts/utils/findConversation';
import type {Contact} from '../src/core/api/endpoints/contacts';

jest.mock('../src/shared/theme/ThemeProvider', () => {
  const palette = jest.requireActual(
    '../src/shared/theme/colors',
  ) as typeof import('../src/shared/theme/colors');
  return {
    ThemeProvider: ({children}: {children: unknown}) => children,
    useTheme: () => ({
      colors: palette.getColors('light'),
      appearance: {cornerRadius: 14, fontSize: 15},
    }),
  };
});

jest.mock('../src/shared/components/SearchBar', () => ({
  SearchBar: ({
    value,
    onChangeText,
  }: {
    value: string;
    onChangeText: (t: string) => void;
  }) => {
    const R = jest.requireActual('react') as typeof import('react');
    const RN = jest.requireActual('react-native') as typeof import('react-native');
    return R.createElement(RN.TextInput, {testID: 'search', value, onChangeText});
  },
}));

jest.mock('../src/features/contacts/components/ContactListItem', () => ({
  ContactListItem: ({
    contact,
    onPress,
  }: {
    contact: {id: string; first_name?: string};
    onPress: (c: unknown) => void;
  }) => {
    const R = jest.requireActual('react') as typeof import('react');
    const RN = jest.requireActual('react-native') as typeof import('react-native');
    return R.createElement(
      RN.Pressable,
      {testID: `contact-${contact.id}`, onPress: () => onPress(contact)},
      R.createElement(RN.Text, null, contact.first_name),
    );
  },
}));

jest.mock('../src/core/api/endpoints/contacts', () => ({
  listContacts: jest.fn(),
  searchContacts: jest.fn(),
}));

jest.mock('../src/core/storage', () => ({
  cacheGetString: jest.fn(async () => undefined),
  cacheSetString: jest.fn(async () => undefined),
  cacheDeleteByPrefix: jest.fn(async () => undefined),
}));

jest.mock('../src/features/contacts/utils/findConversation', () => ({
  findConversationForContact: jest.fn(),
}));

const mockList = listContacts as unknown as jest.Mock;
const mockSearch = searchContacts as unknown as jest.Mock;
const mockFind = findConversationForContact as unknown as jest.Mock;

const awa: Contact = {id: 'ct1', bot_id: 'b1', first_name: 'Awa', initials: 'A'};
const ali: Contact = {id: 'ct2', bot_id: 'b1', first_name: 'Ali'};

const ok = <T,>(data: T) => ({ok: true, status: 200, data});

function texts(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map(n => React.Children.toArray(n.props.children).join(''));
}

async function mount(onOpen = jest.fn()): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      React.createElement(ContactsScreen, {botId: 'b1', onOpenConversation: onOpen}),
    );
  });
  return tree;
}

describe('ContactsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useContactsStore.getState().clear();
    jest.clearAllMocks();
  });

  it('affiche les contacts du bot', async () => {
    mockList.mockResolvedValue(ok({items: [awa, ali], next_cursor: null}));
    const tree = await mount();
    expect(texts(tree)).toEqual(expect.arrayContaining(['Awa', 'Ali']));
  });

  it('liste vide : message dédié', async () => {
    mockList.mockResolvedValue(ok({items: [], next_cursor: null}));
    const tree = await mount();
    expect(texts(tree)).toContain('Aucun contact');
  });

  it('échec de chargement : message d’erreur', async () => {
    mockList.mockResolvedValue({
      ok: false,
      status: 500,
      error: {code: 'E', message: 'Erreur serveur'},
    });
    const tree = await mount();
    expect(texts(tree)).toContain('Erreur serveur');
  });

  it('appui : ouvre la conversation du contact', async () => {
    mockList.mockResolvedValue(ok({items: [awa], next_cursor: null}));
    mockFind.mockResolvedValue({id: 'conv-9', bot_id: 'b1', photo_url: null});
    const onOpen = jest.fn();
    const tree = await mount(onOpen);
    await act(async () => {
      tree.root.findByProps({testID: 'contact-ct1'}).props.onPress();
    });
    expect(mockFind).toHaveBeenCalledWith('b1', awa);
    expect(onOpen).toHaveBeenCalledWith({
      conversation: {
        id: 'conv-9',
        bot_id: 'b1',
        photo_url: null,
        initials: 'A',
      },
    });
  });

  it('conversation introuvable : message, pas d’ouverture', async () => {
    mockList.mockResolvedValue(ok({items: [awa], next_cursor: null}));
    mockFind.mockResolvedValue(null);
    const onOpen = jest.fn();
    const tree = await mount(onOpen);
    await act(async () => {
      tree.root.findByProps({testID: 'contact-ct1'}).props.onPress();
    });
    expect(onOpen).not.toHaveBeenCalled();
    expect(texts(tree)).toContain('Conversation introuvable pour ce contact.');
  });

  it('recherche : après le délai, résultats serveur affichés', async () => {
    jest.useFakeTimers();
    try {
      mockList.mockResolvedValue(ok({items: [awa, ali], next_cursor: null}));
      mockSearch.mockResolvedValue(ok({items: [ali], next_cursor: null}));
      const tree = await mount();
      await act(async () => {
        tree.root.findByProps({testID: 'search'}).props.onChangeText('ali');
      });
      await act(async () => {
        jest.advanceTimersByTime(400);
      });
      expect(mockSearch).toHaveBeenCalledWith('b1', 'ali', 30);
      const all = texts(tree);
      expect(all).toContain('Ali');
      expect(all).not.toContain('Awa');
    } finally {
      jest.useRealTimers();
    }
  });
});

