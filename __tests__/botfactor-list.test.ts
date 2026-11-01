import {
  buildBotfactorListItem,
  isBotfactorListItem,
} from '../src/features/botfactor/listItem';
import {sortItems} from '../src/features/conversations/store/merge';
import type {ConversationSummary} from '../src/core/api/endpoints/conversations';

const conv = (id: string, at: number, pinned = false): ConversationSummary => ({
  id,
  bot_id: 'b1',
  chat_type: 'private',
  pinned,
  last_message_at: at,
});

describe('Botfactor dans la liste Échanges', () => {
  it('reconnaît son identifiant', () => {
    const bf = buildBotfactorListItem({pinned: true, lastAt: 0, lastText: null});
    expect(isBotfactorListItem(bf.id)).toBe(true);
    expect(isBotfactorListItem('123')).toBe(false);
  });

  it('épinglé : reste en tête, même si une conversation est plus récente', () => {
    const bf = buildBotfactorListItem({pinned: true, lastAt: 100, lastText: null});
    const sorted = sortItems([conv('a', 900), bf, conv('b', 500)]);
    expect(sorted[0]?.id).toBe(bf.id);
  });

  it('non épinglé : se range selon sa dernière activité, comme une conversation', () => {
    const bf = buildBotfactorListItem({pinned: false, lastAt: 700, lastText: 'ok'});
    const sorted = sortItems([conv('a', 900), bf, conv('b', 500)]);
    expect(sorted.map(c => c.id)).toEqual(['a', bf.id, 'b']);
  });

  it('affiche le dernier message comme aperçu', () => {
    const bf = buildBotfactorListItem({pinned: true, lastAt: 1, lastText: 'Nom du bot'});
    expect(bf.last_message_text).toBe('Nom du bot');
  });
});
