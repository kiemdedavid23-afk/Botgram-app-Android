import {
  monogram,
  roleTag,
  quotaLevel,
  quotaSegments,
  botState,
  botStateLabel,
  teamFill,
  botTintIndex,
  quotaNote,
  TEAM_MAX,
} from '../src/features/accounts/company/companyLogic';
import {
  inviteRoleLabel,
  inviteRoleHint,
} from '../src/features/accounts/invited/invitedLogic';

describe('companyLogic', () => {
  it('monogram', () => {
    expect(monogram('Acme Corp')).toBe('AC');
    expect(monogram('acme')).toBe('AC');
    expect(monogram('  ')).toBe('·');
    expect(monogram(null)).toBe('·');
  });
  it('roleTag', () => {
    expect(roleTag('owner')).toBe('Propriétaire');
    expect(roleTag('agent')).toBe('Agent');
    expect(roleTag('viewer')).toBe('Lecteur');
  });
  it('quotaLevel seuils 65 / 90', () => {
    expect(quotaLevel(null, 165)).toBe('unknown');
    expect(quotaLevel(10, 0)).toBe('unknown');
    expect(quotaLevel(64, 100)).toBe('ok');
    expect(quotaLevel(65, 100)).toBe('warn');
    expect(quotaLevel(90, 100)).toBe('bad');
  });
  it('quotaSegments', () => {
    expect(quotaSegments(0, 100)).toBe(0);
    expect(quotaSegments(1, 1000)).toBe(1);
    expect(quotaSegments(50, 100)).toBe(12);
    expect(quotaSegments(500, 100)).toBe(24);
  });
  it('botState', () => {
    expect(botState('connected')).toBe('online');
    expect(botState('webhook_error')).toBe('attention');
    expect(botState('pending')).toBe('offline');
    expect(botStateLabel('token_invalid')).toBe('Jeton invalide');
    expect(botStateLabel('disconnected')).toBe('Déconnecté');
  });
  it('teamFill', () => {
    expect(teamFill(0)).toBe(0);
    expect(teamFill(5)).toBe(0.5);
    expect(teamFill(TEAM_MAX + 3)).toBe(1);
  });
  it('botTintIndex : stable et dans les bornes', () => {
    expect(botTintIndex('bot_1', 6)).toBe(botTintIndex('bot_1', 6));
    for (const id of ['', 'a', 'bot_1', 'bot_2', 'x'.repeat(200)]) {
      const i = botTintIndex(id, 6);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(i).toBeLessThan(6);
    }
    expect(botTintIndex('bot_1', 0)).toBe(0);
  });
  it('quotaNote avertit quand la limite approche', () => {
    expect(quotaNote('ok', '')).toBe('Compteur partagé par l’équipe');
    expect(quotaNote('unknown', '08:00')).toBe('Compteur partagé par l’équipe · remis à zéro à 08:00');
    expect(quotaNote('warn', '')).toContain('65 %');
    expect(quotaNote('bad', '08:00')).toBe('Limite presque atteinte · remis à zéro à 08:00');
  });
  it('rôles invité', () => {
    expect(inviteRoleLabel('viewer')).toBe('Lecteur');
    expect(inviteRoleLabel(null)).toBe('…');
    expect(inviteRoleHint('viewer')).toContain('consulter');
    expect(inviteRoleHint('owner')).toBe('');
  });
});
