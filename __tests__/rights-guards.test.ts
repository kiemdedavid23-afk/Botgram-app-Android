import {getRights, setRights} from '../src/core/access/rights';
import {computeAccess} from '../src/features/accounts/access';
import {
  leaveWarning,
  leaveFailureMessage,
} from '../src/features/accounts/invited/leaveLogic';
import {buildConversationMenu} from '../src/features/conversations/components/conversationMenu';

const menu = () =>
  buildConversationMenu({
    pinned: false,
    archived: false,
    onTogglePin: () => undefined,
    onToggleArchive: () => undefined,
    onDelete: () => undefined,
  })
    .flat()
    .map(i => i.id);

describe('droits côté app', () => {
  afterEach(() => setRights({canWrite: true, canOwn: true}));

  it('permissif par défaut', () => {
    expect(getRights()).toEqual({canWrite: true, canOwn: true});
  });

  it('lecteur : ni écriture ni actions propriétaire', () => {
    const a = computeAccess('invited', 'viewer');
    setRights({canWrite: a.canWrite, canOwn: a.canOwn});
    expect(getRights()).toEqual({canWrite: false, canOwn: false});
    expect(menu()).toEqual(['archive']);
  });

  it('agent : écrit, mais ne supprime pas une conversation', () => {
    const a = computeAccess('invited', 'agent');
    setRights({canWrite: a.canWrite, canOwn: a.canOwn});
    expect(menu()).toEqual(['pin', 'archive']);
  });

  it('propriétaire : tout', () => {
    expect(menu()).toEqual(['pin', 'archive', 'delete']);
  });

  it('départ : avertissement sur la suppression du compte', () => {
    const w = leaveWarning('Acme');
    expect(w).toContain('Acme');
    expect(w).toContain('supprimé');
    expect(leaveFailureMessage(undefined, 0)).toContain('connexion');
    expect(leaveFailureMessage('NOT_FOUND', 404)).toContain('déjà plus');
    expect(leaveFailureMessage('FORBIDDEN', 403)).toContain('ne pouvez pas');
  });
});
