import {findCommand, normalize} from '../src/features/botfactor/commands';

describe('normalize', () => {
  it('retire accents, casse, ponctuation', () => {
    expect(normalize('  Texte « À propos » :')).toBe('texte a propos');
    expect(normalize('Menu des commandes')).toBe('menu des commandes');
  });
});

describe('findCommand', () => {
  it.each([
    ['setname', 'setname'],
    ['/setname', 'setname'],
    ['Nom du bot', 'setname'],
    ['nom', 'setname'],
    ['/setabouttext', 'setshortdescription'],
    ['texte à propos', 'setshortdescription'],
    ['a propos', 'setshortdescription'],
    ['bouton du menu', 'setmenubutton'],
    ['Droits d’administrateur proposés', 'setrights'],
    ['droits', 'setrights'],
    ['Menu des commandes (la liste « / »)', 'setcommands'],
    ['commandes', 'setcommands'],
  ])('« %s » → %s', (input, id) => {
    expect(findCommand(input)?.id).toBe(id);
  });

  it('ne reconnaît rien d’inconnu', () => {
    expect(findCommand('blabla')).toBeUndefined();
  });
});
