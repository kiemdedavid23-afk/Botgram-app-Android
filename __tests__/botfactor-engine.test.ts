const mockRun = jest.fn();
jest.mock('../src/features/botfactor/run', () => ({
  runAction: (...a: unknown[]) => mockRun(...a),
}));
jest.mock('../src/features/botprofile', () => ({
  useBotProfileStore: {getState: () => ({load: jest.fn(() => Promise.resolve('ok'))})},
}));
jest.mock('../src/features/bots', () => {
  const state = {
    bots: [{id: 'b1', name: 'Boutique', username: 'boutique_bot', selected: true}],
    load: jest.fn(() => Promise.resolve()),
  };
  return {useBotsStore: {getState: () => state}};
});

import {processInput} from '../src/features/botfactor/engine';
import {useBotfactorStore} from '../src/features/botfactor/store/botfactorStore';

beforeEach(() => {
  mockRun.mockReset();
  useBotfactorStore.getState().reset();
});

describe('Botfactor engine', () => {
  it('affiche le menu avec /start', async () => {
    const r = await processInput('/start');
    expect(r.actions?.some(a => a.value === 'setname')).toBe(true);
  });

  it('refuse un nom vide puis applique un nom valide après confirmation', async () => {
    await processInput('/setname');
    const bad = await processInput('   ');
    expect(bad.text).toContain('obligatoire');
    await processInput('Assistant Boutique');
    mockRun.mockResolvedValue({ok: true});
    const done = await processInput('oui');
    expect(mockRun).toHaveBeenCalledWith('setname', 'b1', {name: 'Assistant Boutique'});
    expect(done.text).toContain('✅');
    expect(useBotfactorStore.getState().action).toBeNull();
  });

  it('annonce un échec quand Telegram refuse', async () => {
    await processInput('setname');
    await processInput('Nouveau');
    mockRun.mockResolvedValue({ok: false, message: 'refusé'});
    const r = await processInput('confirmer');
    expect(r.text).toContain('❌');
    expect(r.text).toContain('refusé');
    expect(r.text).not.toContain('✅');
  });

  it('explique une action par son titre, sans barre oblique', async () => {
    const r = await processInput('Expliquer : Nom du bot');
    expect(r.text.startsWith('Nom du bot')).toBe(true);
    expect(r.text).not.toContain('/setname');
  });

  it('message d’inconnu sans commande technique', async () => {
    const r = await processInput('zzz');
    expect(r.text).toContain('Je n’ai pas compris');
    expect(r.text).not.toMatch(/\/(set|start|mybots)/);
  });

  it('annule si la réponse de confirmation n’est pas « oui »', async () => {
    await processInput('/setdescription');
    await processInput('Une description');
    const r = await processInput('retour');
    expect(mockRun).not.toHaveBeenCalled();
    expect(r.actions?.length).toBeGreaterThan(0);
  });

  it('saute les étapes web_app quand le bouton n’en est pas un', async () => {
    await processInput('/setmenubutton');
    const r = await processInput('commands');
    expect(r.text).toContain('Appliquer ce bouton de menu');
  });

  it('demande texte et lien https pour une application web', async () => {
    await processInput('/setmenubutton');
    await processInput('web_app');
    await processInput('Ouvrir');
    const bad = await processInput('http://x.test');
    expect(bad.text).toContain('https://');
    const ok = await processInput('https://x.test/app');
    expect(ok.text).toContain('Application web');
  });

  it('autorise la description vide', async () => {
    await processInput('/setdescription');
    const r = await processInput('__empty__');
    expect(r.text).toContain('Confirmer');
  });
});
