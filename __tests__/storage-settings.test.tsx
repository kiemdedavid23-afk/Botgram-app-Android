/**
 * Réglages stockage : tailles affichées, « Vider » avec confirmation,
 * annulation sans effet — 6bis-d.
 */
import React from 'react';
import {Alert, Text} from 'react-native';
import renderer, {act} from 'react-test-renderer';
import {StorageSettingsScreen} from '../src/features/settings/StorageSettingsScreen';
import {
  setMediaStorageForTests,
  resetMediaStorageForTests,
  type MediaStorage,
} from '../src/core/media/MediaStorage';
import {settingsStorageTexts as t} from '../src/features/settings/storageTexts';

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

jest.mock('../src/features/settings/components/SettingsPage', () => ({
  SettingsPage: ({children}: {children: unknown}) => children,
}));

jest.mock('../src/core/archive', () => ({
  getArchiveStore: () => ({sizeBytes: async () => 4096}),
}));

type AlertButton = {text?: string; onPress?: () => void};

function fakeStorage(total: number, clearAll: jest.Mock): MediaStorage {
  return {
    exists: jest.fn(async () => false),
    writeBase64: jest.fn(async () => ''),
    readBase64: jest.fn(async () => null),
    delete: jest.fn(async () => undefined),
    sizeOf: jest.fn(async () => 0),
    totalSize: jest.fn(async () => total),
    clearAll,
    localPath: (id: string) => `/fake/${id}`,
  };
}

function clearButton(tree: renderer.ReactTestRenderer) {
  const nodes = tree.root.findAllByProps({accessibilityLabel: t.clearMedia});
  const node = nodes.find(n => typeof n.props.onPress === 'function');
  if (!node) {
    throw new Error('bouton « Vider » introuvable');
  }
  return node;
}

function texts(tree: renderer.ReactTestRenderer): string[] {
  return tree.root
    .findAllByType(Text)
    .map(n => React.Children.toArray(n.props.children).join(''));
}

async function mount(): Promise<renderer.ReactTestRenderer> {
  let tree!: renderer.ReactTestRenderer;
  await act(async () => {
    tree = renderer.create(
      React.createElement(StorageSettingsScreen, {onBack: jest.fn()}),
    );
  });
  return tree;
}

describe('StorageSettingsScreen', () => {
  let alertSpy: jest.SpyInstance;

  beforeEach(() => {
    alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
  });

  afterEach(() => {
    alertSpy.mockRestore();
    resetMediaStorageForTests();
  });

  it('affiche la taille des médias et celle de l’archive', async () => {
    setMediaStorageForTests(fakeStorage(2048, jest.fn(async () => undefined)));
    const tree = await mount();
    const all = texts(tree);
    expect(all).toContain(`${t.mediaFiles} : 2.0 Ko`);
    expect(all).toContain(`${t.archiveDb} : 4.0 Ko`);
  });

  it('« Vider » demande confirmation ; annuler ne supprime rien', async () => {
    const clearAll = jest.fn(async () => undefined);
    setMediaStorageForTests(fakeStorage(2048, clearAll));
    const tree = await mount();
    const btn = clearButton(tree);
    await act(async () => {
      btn.props.onPress();
    });
    expect(alertSpy).toHaveBeenCalledTimes(1);
    expect(clearAll).not.toHaveBeenCalled();
    const buttons = alertSpy.mock.calls[0]![2] as AlertButton[];
    const cancel = buttons.find(b => b.text === t.clearConfirmCancel);
    expect(cancel?.onPress).toBeUndefined();
    expect(clearAll).not.toHaveBeenCalled();
  });

  it('confirmer vide les médias et l’indique', async () => {
    const clearAll = jest.fn(async () => undefined);
    setMediaStorageForTests(fakeStorage(2048, clearAll));
    const tree = await mount();
    const btn = clearButton(tree);
    await act(async () => {
      btn.props.onPress();
    });
    const buttons = alertSpy.mock.calls[0]![2] as AlertButton[];
    const ok = buttons.find(b => b.text === t.clearConfirmOk);
    await act(async () => {
      ok?.onPress?.();
    });
    expect(clearAll).toHaveBeenCalledTimes(1);
    expect(texts(tree)).toContain(t.clearDone);
  });
});
