import {
  seatsLeft,
  pendingInvites,
  daysLeft,
  expiryLabel,
  validateInvite,
  memberActions,
  sortMembers,
  describeTeamError,
  buildCompanyPatch,
  isEmptyPatch,
  shareInviteText,
  roleName,
  TEAM_MAX,
} from '../src/features/team/utils/teamLogic';
import type {Invite, TeamMember} from '../src/core/api/endpoints/team';

const DAY = 24 * 60 * 60 * 1000;
const inv = (over: Partial<Invite> = {}): Invite => ({
  id: 'i1',
  email: 'a@b.com',
  role: 'agent',
  status: 'pending',
  expires_at: 10 * DAY,
  created_at: 0,
  ...over,
});
const mem = (id: string, role: TeamMember['role'], joined = 1): TeamMember => ({
  member_id: id,
  display_name: id,
  role,
  joined_at: joined,
});

describe('teamLogic', () => {
  it('places restantes : personnes + invitations ≤ 10', () => {
    expect(seatsLeft(4, 2)).toBe(TEAM_MAX - 6);
    expect(seatsLeft(9, 3)).toBe(0);
  });
  it('invitations en attente seulement, non expirées', () => {
    const list = [inv(), inv({id: 'i2', status: 'accepted'}), inv({id: 'i3', expires_at: 5})];
    expect(pendingInvites(list, 100).map(i => i.id)).toEqual(['i1']);
  });
  it('expiration', () => {
    expect(daysLeft(3 * DAY, 0)).toBe(3);
    expect(expiryLabel(DAY, 0)).toBe('Expire dans 1 jour');
    expect(expiryLabel(0, 5)).toBe('Expirée');
  });
  it('validation d’invitation', () => {
    expect(validateInvite('pas-un-mail', 3).ok).toBe(false);
    expect(validateInvite(' A@B.com ', 3).ok).toBe(true);
    expect(validateInvite('x@y.com', 0).ok).toBe(false);
    // Réinviter une adresse déjà en attente remplace l'ancienne : permis même plein.
    expect(validateInvite('A@b.com', 0, [inv()]).ok).toBe(true);
  });
  it('actions sur une personne', () => {
    expect(memberActions(true, mem('x', 'agent'), 'me').canRemove).toBe(true);
    expect(memberActions(true, mem('o', 'owner'), 'me').canRemove).toBe(false);
    expect(memberActions(true, mem('me', 'agent'), 'me').canRemove).toBe(false);
    expect(memberActions(false, mem('x', 'agent'), 'me').canChangeRole).toBe(false);
  });
  it('tri : propriétaire en tête, puis ancienneté', () => {
    const r = sortMembers([mem('b', 'agent', 5), mem('o', 'owner', 9), mem('a', 'viewer', 2)]);
    expect(r.map(m => m.member_id)).toEqual(['o', 'a', 'b']);
  });
  it('messages d’erreur du Worker', () => {
    expect(describeTeamError('INVITE_EMAIL_REGISTERED')).toContain('déjà un compte');
    expect(describeTeamError('WORKSPACE_LIMIT_REACHED')).toContain('complète');
    expect(describeTeamError('CONFLICT', {reason: 'already_member'})).toContain('déjà');
    expect(describeTeamError('FORBIDDEN', {reason: 'owner_role'})).toContain('transfert');
    expect(describeTeamError('WORKSPACE_HAS_MEMBERS')).toContain('Transférez');
    expect(describeTeamError(undefined)).toContain('erreur');
  });
  it('modification de l’entreprise : seulement ce qui change', () => {
    const cur = {name: 'Acme', country: 'BF', sector: 'Commerce', phone: '+22625000000'};
    const same = buildCompanyPatch({name: 'Acme', country: 'BF', sector: 'Commerce', phone: '+226 25 00 00 00'}, cur);
    expect(same.ok && isEmptyPatch(same.patch)).toBe(true);
    const chg = buildCompanyPatch({name: 'Acme SA', country: 'ci', sector: 'Commerce', phone: ''}, cur);
    expect(chg.ok && chg.patch).toEqual({name: 'Acme SA', country: 'CI'});
    expect(buildCompanyPatch({name: 'A', country: '', sector: '', phone: ''}, cur).ok).toBe(false);
    expect(buildCompanyPatch({name: 'Acme', country: '', sector: '', phone: '25000000'}, cur).ok).toBe(false);
    expect(buildCompanyPatch({name: 'Acme', country: 'Burkina', sector: '', phone: ''}, cur).ok).toBe(false);
  });
  it('texte de partage', () => {
    const t = shareInviteText('K7QM-4XNP', 'Acme', 'a@b.com');
    expect(t).toContain('K7QM-4XNP');
    expect(t).toContain('a@b.com');
    expect(roleName('viewer')).toBe('Lecteur');
  });
});
