/**
 * Étape 7 — retrouver la conversation d'un contact.
 */
import {
  findConversationForContact,
  matchesContact,
} from '../src/features/contacts/utils/findConversation';
import {archiveListConversations} from '../src/core/archive/hydrate';
import {searchConversations} from '../src/core/api/endpoints/conversations';
import type {Contact} from '../src/core/api/endpoints/contacts';
import type {ConversationSummary} from '../src/core/realtime/events';

let mockItems: ConversationSummary[] = [];

jest.mock('../src/features/conversations/store/conversationsStore', () => ({
  useConversationsStore: {getState: () => ({items: mockItems})},
}));

jest.mock('../src/core/archive/hydrate', () => ({
  archiveListConversations: jest.fn(),
}));

jest.mock('../src/core/api/endpoints/conversations', () => ({
  searchConversations: jest.fn(),
}));

const mockArchive = archiveListConversations as unknown as jest.Mock;
const mockServer = searchConversations as unknown as jest.Mock;

const contact: Contact = {id: 'ct1', bot_id: 'b1', first_name: 'Awa', username: 'awa_t'};

function conv(partial: Partial<ConversationSummary>): ConversationSummary {
  return {id: 'c1', bot_id: 'b1', chat_type: 'private', ...partial};
}

describe('matchesContact', () => {
  it('contact_id identique', () => {
    expect(matchesContact(conv({contact_id: 'ct1'}), contact)).toBe(true);
  });

  it('contact_id différent : non, même pseudo identique', () => {
    expect(matchesContact(conv({contact_id: 'autre', username: 'awa_t'}), contact)).toBe(false);
  });

  it('sans contact_id : discussion privée de même pseudo (casse et @ ignorés)', () => {
    expect(matchesContact(conv({username: '@Awa_T'}), contact)).toBe(true);
    expect(matchesContact(conv({username: 'autre'}), contact)).toBe(false);
  });

  it('groupe de même pseudo : non', () => {
    expect(matchesContact(conv({chat_type: 'group', username: 'awa_t'}), contact)).toBe(false);
  });

  it('contact sans pseudo et sans lien : non', () => {
    expect(matchesContact(conv({}), {id: 'ct2', bot_id: 'b1'})).toBe(false);
  });
});

describe('findConversationForContact', () => {
  beforeEach(() => {
    mockItems = [];
    mockArchive.mockReset();
    mockServer.mockReset();
    mockArchive.mockResolvedValue(null);
    mockServer.mockResolvedValue({ok: false, status: 0, error: {code: 'E', message: ''}});
  });

  it('trouvée dans la liste chargée : ni archive ni serveur', async () => {
    mockItems = [conv({id: 'loaded', contact_id: 'ct1'})];
    const res = await findConversationForContact('b1', contact);
    expect(res?.id).toBe('loaded');
    expect(mockArchive).not.toHaveBeenCalled();
    expect(mockServer).not.toHaveBeenCalled();
  });

  it('trouvée dans l’archive : pas de requête serveur', async () => {
    mockArchive.mockResolvedValue([conv({id: 'archived', contact_id: 'ct1'})]);
    const res = await findConversationForContact('b1', contact);
    expect(res?.id).toBe('archived');
    expect(mockServer).not.toHaveBeenCalled();
  });

  it('trouvée par le serveur (recherche sur le pseudo)', async () => {
    mockServer.mockResolvedValue({
      ok: true,
      status: 200,
      data: {items: [conv({id: 'remote', contact_id: 'ct1'})], next_cursor: null},
    });
    const res = await findConversationForContact('b1', contact);
    expect(res?.id).toBe('remote');
    expect(mockServer).toHaveBeenCalledWith('b1', 'awa_t', 30);
  });

  it('introuvable : null', async () => {
    expect(await findConversationForContact('b1', contact)).toBeNull();
  });

  it('contact sans pseudo ni prénom : pas de recherche serveur', async () => {
    expect(await findConversationForContact('b1', {id: 'x', bot_id: 'b1'})).toBeNull();
    expect(mockServer).not.toHaveBeenCalled();
  });
});
