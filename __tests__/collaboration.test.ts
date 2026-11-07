import {
  canDeleteMessage,
  setRights,
} from '../src/core/access/rights';
import {senderLabel} from '../src/features/thread/utils/sender';
import {
  applyTeamFilter,
  folderCounts,
} from '../src/features/conversations/store/filters';
import {assignableMembers} from '../src/features/team/utils/teamLogic';
import type {ConversationSummary} from '../src/core/api/endpoints/conversations';

const conv = (id: string, assigned?: {id: string; display_name: string} | null): ConversationSummary => ({
  id,
  bot_id: 'b',
  assigned_to: assigned,
});

describe('suppression d’un message', () => {
  afterEach(() => setRights({}));
  const mine = {id: 'm1', direction: 'out' as const, sent_by: {id: 'me', display_name: 'Moi'}};
  const theirs = {id: 'm2', direction: 'out' as const, sent_by: {id: 'x', display_name: 'Awa'}};
  const old = {id: 'm3', direction: 'out' as const};
  const orphan = {id: 'm4', direction: 'out' as const, sent_by: null};
  const incoming = {id: 'm5', direction: 'in' as const};

  it('propriétaire : tous les messages sortants', () => {
    setRights({role: 'owner', canWrite: true, canOwn: true, memberId: 'me'});
    expect([mine, theirs, old, orphan].every(m => canDeleteMessage(m))).toBe(true);
    expect(canDeleteMessage(incoming)).toBe(false);
  });
  it('agent : seulement les siens', () => {
    setRights({role: 'agent', canWrite: true, canOwn: false, memberId: 'me'});
    expect(canDeleteMessage(mine)).toBe(true);
    expect(canDeleteMessage(theirs)).toBe(false);
    expect(canDeleteMessage(old)).toBe(false);
    expect(canDeleteMessage(orphan)).toBe(false);
    expect(canDeleteMessage({id: 'local:1', direction: 'out'})).toBe(true);
  });
  it('lecteur : aucun', () => {
    setRights({role: 'viewer', canWrite: false, canOwn: false, memberId: 'me'});
    expect(canDeleteMessage(mine)).toBe(false);
  });
});

describe('étiquette « envoyé par »', () => {
  it('rien hors équipe, pour un message entrant ou ancien', () => {
    expect(senderLabel({direction: 'out', sent_by: {id: 'a', display_name: 'Awa'}}, 'me', false)).toBeNull();
    expect(senderLabel({direction: 'in'}, 'me', true)).toBeNull();
    expect(senderLabel({direction: 'out'}, 'me', true)).toBeNull();
  });
  it('null = ancien membre ; soi = Vous ; sinon le nom', () => {
    expect(senderLabel({direction: 'out', sent_by: null}, 'me', true)).toBe('Ancien membre');
    expect(senderLabel({direction: 'out', sent_by: {id: 'me', display_name: 'Moi'}}, 'me', true)).toBe('Vous');
    expect(senderLabel({direction: 'out', sent_by: {id: 'a', display_name: 'Awa'}}, 'me', true)).toBe('Awa');
  });
});

describe('dossiers d’équipe', () => {
  const list = [
    conv('1', {id: 'me', display_name: 'Moi'}),
    conv('2', {id: 'a', display_name: 'Awa'}),
    conv('3', null),
    conv('4'),
  ];
  it('Mes échanges / Non assignés', () => {
    expect(applyTeamFilter(list, 'mine', 'me').map(c => c.id)).toEqual(['1']);
    expect(applyTeamFilter(list, 'unassigned', 'me').map(c => c.id)).toEqual(['3', '4']);
    expect(applyTeamFilter(list, 'all', 'me')).toHaveLength(4);
    expect(applyTeamFilter(list, 'mine', null)).toHaveLength(0);
  });
  it('compteurs', () => {
    const c = folderCounts(list, {}, 'me');
    expect(c.mine).toBe(1);
    expect(c.unassigned).toBe(2);
  });
});

describe('assignation', () => {
  it('propriétaire et agents, pas les lecteurs', () => {
    const m = (id: string, role: 'owner' | 'agent' | 'viewer') => ({member_id: id, display_name: id, role, joined_at: 1});
    expect(assignableMembers([m('v', 'viewer'), m('a', 'agent'), m('o', 'owner')]).map(x => x.member_id)).toEqual(['o', 'a']);
  });
});
