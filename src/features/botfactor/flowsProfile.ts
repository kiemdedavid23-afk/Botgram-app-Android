/** Flux guidés : nom, description, texte « À propos » (limites Telegram). */
import type {FactorCommand} from './types';
import {texts as T} from './texts';

const confirmStep = (prompt: string) => ({
  id: 'confirm',
  type: 'confirm' as const,
  prompt,
});

export const PROFILE_FLOWS: FactorCommand[] = [
  {
    id: 'setname',
    label: 'setname',
    title: 'Nom du bot',
    keywords: ['nom', 'name'],
    menuLabel: 'Modifier le nom',
    description: 'Modifier le nom affiché du bot',
    longDescription:
      'Le nom est le titre principal du bot : en haut des conversations, dans la recherche et sur sa fiche.\n\nLimite : 1 à 64 caractères.\nExemple : « Assistant Boutique »',
    steps: [
      {
        id: 'name',
        type: 'text',
        prompt: 'Quel est le nouveau nom ? (1 à 64 caractères)',
        validate: v => {
          if (!v.trim()) return 'Le nom est obligatoire.';
          if (v.trim().length > 64) return 'Maximum 64 caractères.';
          return null;
        },
      },
      confirmStep(T.confirm),
    ],
  },
  {
    id: 'setdescription',
    label: 'setdescription',
    title: 'Description (texte du chat vide)',
    keywords: ['description', 'chat vide', 'accueil'],
    menuLabel: 'Modifier la description',
    description: 'Modifier la description (« Que peut faire ce bot ? »)',
    longDescription:
      'La description s’affiche dans le chat vide, sous « Que peut faire ce bot ? ».\n\nLimite : 0 à 512 caractères. Vide = suppression.\nExemple : « Je vous aide à suivre une commande ou contacter le support. »',
    steps: [
      {
        id: 'description',
        type: 'text',
        allowEmpty: true,
        prompt: 'Envoyez la nouvelle description (0 à 512 caractères).',
        validate: v => (v.length > 512 ? 'Maximum 512 caractères.' : null),
      },
      confirmStep(T.confirm),
    ],
  },
  {
    id: 'setshortdescription',
    label: 'setshortdescription',
    title: 'Texte « À propos »',
    keywords: ['a propos', 'about', 'apropos', 'courte'],
    menuLabel: 'Modifier le texte À propos',
    description: 'Modifier le texte « À propos » (description courte)',
    longDescription:
      'Phrase courte affichée sur la fiche du bot et dans les liens de partage.\n\nLimite : 0 à 120 caractères. Vide = suppression.\nExemple : « Assistant boutique : produits, prix et livraisons. »',
    steps: [
      {
        id: 'short',
        type: 'text',
        allowEmpty: true,
        prompt: 'Envoyez le nouveau texte « À propos » (0 à 120 caractères).',
        validate: v => (v.length > 120 ? 'Maximum 120 caractères.' : null),
      },
      confirmStep(T.confirm),
    ],
  },
];
