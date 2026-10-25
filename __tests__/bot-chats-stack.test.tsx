/**
 * BotChatsStack — retour matériel quand un fil est ouvert.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {BotChatsStack} from '../src/features/conversations/navigation/BotChatsStack';

const mockAdd = jest.fn();
const mockRemove = jest.fn();

jest.mock('react-native', () => {
  const ReactNative = jest.requireActual('react-native') as Record<
    string,
    unknown
  >;
  return {
    ...ReactNative,
    BackHandler: {
      addEventListener: (...args: unknown[]) => {
        mockAdd(...args);
        return {remove: mockRemove};
      },
    },
  };
});

jest.mock('../src/features/conversations/screens/ConversationsScreen', () => {
  const R = jest.requireActual('react') as typeof import('react');
  const RN = jest.requireActual('react-native') as typeof import('react-native');
  return {
    ConversationsScreen: ({
      onOpenConversation,
    }: {
      onOpenConversation: (id: string) => void;
    }) =>
      R.createElement(
        RN.Pressable,
        {
          testID: 'open',
          onPress: () => onOpenConversation('c1'),
        },
        R.createElement(RN.Text, null, 'list'),
      ),
  };
});

jest.mock('../src/features/thread/screens/ThreadScreen', () => {
  const R = jest.requireActual('react') as typeof import('react');
  const RN = jest.requireActual('react-native') as typeof import('react-native');
  return {
    ThreadScreen: ({onBack}: {onBack: () => void}) =>
      R.createElement(
        RN.Pressable,
        {testID: 'back', onPress: onBack},
        R.createElement(RN.Text, null, 'thread'),
      ),
  };
});

jest.mock('../src/features/conversations/store/conversationsStore', () => {
  const {create} = jest.requireActual('zustand') as typeof import('zustand');
  const store = create(() => ({
    items: [
      {
        id: 'c1',
        bot_id: 'b',
        title: 'Chat',
        photo_url: null as string | null,
        initials: 'C' as string | null,
      },
    ],
  }));
  return {
    useConversationsStore: store,
    conversationTitle: () => 'Chat',
  };
});

describe('BotChatsStack BackHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('enregistre le listener quand un fil est ouvert et consomme le retour', () => {
    let tree: renderer.ReactTestRenderer;
    act(() => {
      tree = renderer.create(React.createElement(BotChatsStack));
    });
    const openBtn = tree!.root.findByProps({testID: 'open'});
    act(() => {
      openBtn.props.onPress();
    });
    expect(mockAdd).toHaveBeenCalled();
    const handler = mockAdd.mock.calls.find(
      c => c[0] === 'hardwareBackPress',
    )?.[1] as (() => boolean) | undefined;
    expect(typeof handler).toBe('function');
    let result = false;
    act(() => {
      result = handler!();
    });
    expect(result).toBe(true);
  });
});
