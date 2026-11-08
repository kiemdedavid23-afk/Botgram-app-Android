import {COMPANY_HUB_GROUPS} from '../src/features/settings/screens/companyHubGroups';

describe('hub Paramètres (compte entreprise)', () => {
  const routes = COMPANY_HUB_GROUPS.flatMap(g => g.routes);

  it('chaque réglage apparaît une seule fois', () => {
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('tous les réglages du hub Botgram restent accessibles', () => {
    expect([...routes].sort()).toEqual(
      ['appearance', 'discussions', 'documentation', 'language', 'permissions', 'storage'].sort(),
    );
  });

  it('trois groupes, aucun vide, identifiants uniques', () => {
    expect(COMPANY_HUB_GROUPS).toHaveLength(3);
    for (const g of COMPANY_HUB_GROUPS) expect(g.routes.length).toBeGreaterThan(0);
    const ids = COMPANY_HUB_GROUPS.map(g => g.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
