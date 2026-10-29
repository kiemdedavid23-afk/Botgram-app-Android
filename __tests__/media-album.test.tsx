import React from 'react';
import renderer, {act} from 'react-test-renderer';
import {MediaAlbum} from '../src/features/thread/components/MediaAlbum';

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

jest.mock('../src/features/thread/components/MediaPhoto', () => ({
  MediaPhoto: ({messageId}: {messageId: string}) => {
    const R = jest.requireActual('react') as typeof import('react');
    const RN = jest.requireActual(
      'react-native',
    ) as typeof import('react-native');
    return R.createElement(RN.Text, {testID: `photo-${messageId}`}, messageId);
  },
}));

jest.mock('../src/features/thread/components/MediaFile', () => ({
  MediaFile: ({messageId}: {messageId: string}) => {
    const R = jest.requireActual('react') as typeof import('react');
    const RN = jest.requireActual(
      'react-native',
    ) as typeof import('react-native');
    return R.createElement(RN.Text, {testID: `file-${messageId}`}, messageId);
  },
}));

describe('MediaAlbum', () => {
  it('rend 10 éléments', async () => {
    const items = Array.from({length: 10}, (_, i) => ({
      id: `a${i}`,
      kind: 'photo',
      attachment: {name: `p${i}.jpg`, mime: 'image/jpeg', size: 100},
    }));
    let tree!: renderer.ReactTestRenderer;
    await act(async () => {
      tree = renderer.create(React.createElement(MediaAlbum, {items}));
    });
    for (let i = 0; i < 10; i += 1) {
      expect(tree.root.findByProps({testID: `photo-a${i}`})).toBeTruthy();
    }
  });
});
