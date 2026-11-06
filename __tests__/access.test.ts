import {computeAccess, isAccessLost} from '../src/features/accounts/access';
import type {Workspace} from '../src/core/api/endpoints/workspaces';

const ws = (role: Workspace['role']): Workspace => ({
  id: 'c_1',
  kind: 'company',
  name: 'Acme',
  role,
  owner: {id: 'o', display_name: 'Moussa'},
  members_count: 3,
  country: null,
  sector: null,
  phone: null,
  created_at: 1,
});

describe('droits selon le type de compte et le rôle', () => {
  it('particulier propriétaire : tout sauf l’équipe', () => {
    expect(computeAccess('personal', 'owner')).toEqual({
      role: 'owner',
      roleKnown: true,
      canWrite: true,
      canOwn: true,
      canLinkBot: true,
      canManageTeam: false,
      canSeeTeam: false,
      canLeave: false,
    });
  });

  it('entreprise propriétaire : gère l’équipe, ne peut pas quitter', () => {
    const a = computeAccess('company', 'owner');
    expect(a.canManageTeam).toBe(true);
    expect(a.canLinkBot).toBe(true);
    expect(a.canSeeTeam).toBe(true);
    expect(a.canLeave).toBe(false);
  });

  it('invité agent : lit et répond, ne lie rien, peut quitter', () => {
    const a = computeAccess('invited', 'agent');
    expect(a.canWrite).toBe(true);
    expect(a.canOwn).toBe(false);
    expect(a.canLinkBot).toBe(false);
    expect(a.canManageTeam).toBe(false);
    expect(a.canSeeTeam).toBe(true);
    expect(a.canLeave).toBe(true);
  });

  it('invité lecteur : lecture seule', () => {
    const a = computeAccess('invited', 'viewer');
    expect(a.canWrite).toBe(false);
    expect(a.canOwn).toBe(false);
    expect(a.canLeave).toBe(true);
  });

  it('ancien propriétaire devenu invité agent : ne lie plus de bot', () => {
    expect(computeAccess('invited', 'agent').canLinkBot).toBe(false);
  });

  it('rôle inconnu : propriétaire pour particulier et entreprise, lecture seule pour invité', () => {
    expect(computeAccess('personal', null)).toMatchObject({
      role: 'owner',
      roleKnown: false,
      canWrite: true,
    });
    expect(computeAccess('company', null).canWrite).toBe(true);
    expect(computeAccess('invited', null)).toMatchObject({
      role: 'viewer',
      roleKnown: false,
      canWrite: false,
    });
  });
});

describe('accès perdu', () => {
  it('invité ou entreprise sans espace, liste lue en ligne : perdu', () => {
    expect(isAccessLost('invited', [], true)).toBe(true);
    expect(isAccessLost('company', [], true)).toBe(true);
  });

  it('jamais avant une réponse du Worker', () => {
    expect(isAccessLost('invited', [], false)).toBe(false);
  });

  it('jamais pour un particulier', () => {
    expect(isAccessLost('personal', [], true)).toBe(false);
  });

  it('pas perdu s’il reste un espace', () => {
    expect(isAccessLost('invited', [ws('agent')], true)).toBe(false);
  });
});
