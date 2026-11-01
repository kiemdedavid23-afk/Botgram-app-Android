import {parseCommands} from '../src/features/botfactor/parseCommands';

describe('parseCommands', () => {
  it('lit une liste valide', () => {
    const r = parseCommands('start - Démarrer\n/Aide : Afficher l’aide');
    expect(r).toEqual({
      ok: true,
      items: [
        {command: 'start', description: 'Démarrer'},
        {command: 'aide', description: 'Afficher l’aide'},
      ],
    });
  });

  it('refuse une liste vide', () => {
    expect(parseCommands('  \n ').ok).toBe(false);
  });

  it('refuse un nom invalide', () => {
    expect(parseCommands('Mon-Cmd - test').ok).toBe(false);
    expect(parseCommands('a'.repeat(33) + ' - test').ok).toBe(false);
  });

  it('refuse les doublons et les descriptions trop longues', () => {
    expect(parseCommands('a - un\na - deux').ok).toBe(false);
    expect(parseCommands(`a - ${'x'.repeat(257)}`).ok).toBe(false);
  });
});
