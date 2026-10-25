/**
 * BotChatsStack — retour matériel quand un fil est ouvert.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {BackHandler} from 'react-native';
import {BotChatsStack} from '../src/features/conversations/navigation/BotChatsStack';

const mockAdd = jest.fn();
const mockRemove = jest.fn();

jest.mock('react-native/Libraries/Utilities/BackHandler', () => ({
  __esModule: true,
  default: {
    addEventListener: (...args: unknown[]) => {
      mockAdd(...args);
      return {remove: mockRemove};
    },
    removeEventListener: jest.fn(),
    exitApp: jest.fn(),
  },
}));

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
    // Prefer mockAdd from our factory; fall back to spy if RN re-exports differently
    const addCalls =
      mockAdd.mock.calls.length > 0
        ? mockAdd.mock.calls
        : (BackHandler.addEventListener as jest.Mock).mock?.calls ?? [];
    expect(addCalls.length).toBeGreaterThan(0);
    const handler = addCalls.find(
      (c: unknown[]) => c[0] === 'hardwareBackPress',
    )?.[1] as (() => boolean) | undefined;
    expect(typeof handler).toBe('function');
    let result = false;
    act(() => {
      result = handler!();
    });
    expect(result).toBe(true);
  });
});
