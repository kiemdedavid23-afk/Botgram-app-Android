/**
 * 6bis-e — section « Messages » des résultats de recherche.
 */
import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {Text} from 'react-native';
import {MessageSearchResults} from '../src/features/conversations/components/MessageSearchResults';
import type {MessageSearchHit} from '../src/core/archive/ftsRepo';

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

const hit: MessageSearchHit = {
  messageId: 'm1',
  conversationId: 'c1',
  conversationTitle: 'Awa Traoré',
  direction: 'out',
  createdAt: 1_700_000_000_000,
  segments: [
    {text: 'Merci pour la ', hit: false},
    {text: 'réponse', hit: true},
  ],
};

function allText(tree: renderer.ReactTestRenderer): string {
  return tree.root
    .findAllByType(Text)
    .map(n => React.Children.toArray(n.props.children).join(''))
    .join('|');
}

describe('MessageSearchResults', () => {
  it('aucun résultat : rien n’est rendu', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(React.createElement(MessageSearchResults, {hits: []}));
    });
    expect(tree.toJSON()).toBeNull();
  });

  it('affiche section, titre, « Vous : » et extrait', async () => {
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        React.createElement(MessageSearchResults, {hits: [hit]}),
      );
    });
    const text = allText(tree);
    expect(text).toContain('Messages');
    expect(text).toContain('Awa Traoré');
    expect(text).toContain('Vous : ');
    expect(text).toContain('Merci pour la ');
    expect(text).toContain('réponse');
  });

  it('appui : ouvre la conversation du message', async () => {
    const onOpen = jest.fn();
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(
        React.createElement(MessageSearchResults, {hits: [hit], onOpen}),
      );
    });
    const row = tree.root
      .findAllByProps({accessibilityLabel: 'Awa Traoré'})
      .find(n => typeof n.props.onPress === 'function');
    await act(async () => {
      row?.props.onPress();
    });
    expect(onOpen).toHaveBeenCalledWith('c1');
  });
});
