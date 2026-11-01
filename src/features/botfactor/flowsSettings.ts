/** Flux guidés : commandes, bouton de menu, droits d'admin, photo. */
import type {FactorCommand, FlowData} from './types';
import {parseCommands} from './parseCommands';

const recapMenu = (d: FlowData): string => {
  if (d.type === 'web_app') {
    return `Application web « ${d.wtext ?? ''} »\n${d.wurl ?? ''}`;
  }
  return d.type === 'commands' ? 'Liste des commandes' : 'Par défaut';
};

const recapRights = (d: FlowData): string =>
  `${d.target === 'channels' ? 'Canaux' : 'Groupes'} : ${
    d.mode === 'none' ? 'tout retirer' : 'tout activer'
  }`;

export const SETTINGS_FLOWS: FactorCommand[] = [
  {
    id: 'setcommands',
    label: 'setcommands',
    title: 'Menu des commandes (la liste « / »)',
    keywords: ['commandes', 'menu des commandes', 'liste', 'slash'],
    menuLabel: 'Gérer les commandes',
    description: 'Gérer les commandes proposées avec « / »',
    longDescription:
      'Les commandes apparaissent quand on tape « / » dans le chat.\n\nFormat : une par ligne, « commande - description ».\nExemple :\nstart - Démarrer\naide - Afficher l’aide',
    steps: [
      {
        id: 'list',
        type: 'text',
        prompt:
          'Envoyez la liste complète (une commande par ligne) :\n\nstart - Démarrer\naide - Afficher l’aide\n\nL’ancienne liste sera remplacée.',
        validate: v => {
          const r = parseCommands(v);
          return r.ok ? null : r.error;
        },
      },
      {
        id: 'confirm',
        type: 'confirm',
        prompt: d => {
          const r = parseCommands(d.list ?? '');
          const n = r.ok ? r.items.length : 0;
          return `Remplacer la liste par ces ${n} commande(s) ?`;
        },
      },
    ],
  },
  {
    id: 'setmenubutton',
    label: 'setmenubutton',
    title: 'Bouton du menu',
    keywords: ['bouton', 'bouton de menu', 'menu button', 'application web'],
    menuLabel: 'Bouton de menu',
    description: 'Configurer le bouton à côté du champ de message',
    longDescription:
      'Le bouton de menu est à côté du champ de saisie (chats privés) : par défaut, liste des commandes, ou application web (lien https).',
    steps: [
      {
        id: 'type',
        type: 'choice',
        prompt: 'Quel type de bouton souhaitez-vous ?',
        choices: [
          {label: 'Par défaut', value: 'default'},
          {label: 'Liste des commandes', value: 'commands'},
          {label: 'Application web', value: 'web_app'},
        ],
      },
      {
        id: 'wtext',
        type: 'text',
        skipIf: d => d.type !== 'web_app',
        prompt: 'Texte du bouton ? (1 à 16 caractères)',
        validate: v =>
          v.trim().length >= 1 && v.trim().length <= 16
            ? null
            : 'Le texte doit faire 1 à 16 caractères.',
      },
      {
        id: 'wurl',
        type: 'text',
        skipIf: d => d.type !== 'web_app',
        prompt: 'Lien de l’application (https://…) ?',
        validate: v =>
          /^https:\/\/[^\s]+$/i.test(v.trim())
            ? null
            : 'Entrez un lien valide qui commence par https://',
      },
      {
        id: 'confirm',
        type: 'confirm',
        prompt: d => `Appliquer ce bouton de menu ?\n\n${recapMenu(d)}`,
      },
    ],
  },
  {
    id: 'setrights',
    label: 'setrights',
    title: 'Droits d’administrateur proposés',
    keywords: ['droits', 'admin', 'administrateur', 'permissions'],
    menuLabel: 'Droits admin',
    description: 'Droits proposés quand le bot est ajouté comme admin',
    longDescription:
      'Ces droits sont seulement proposés : la personne qui ajoute le bot peut les modifier. Vous pouvez tout activer ou tout retirer, pour les groupes ou les canaux.',
    steps: [
      {
        id: 'target',
        type: 'choice',
        prompt: 'Pour quels chats ?',
        choices: [
          {label: 'Groupes', value: 'groups'},
          {label: 'Canaux', value: 'channels'},
        ],
      },
      {
        id: 'mode',
        type: 'choice',
        prompt: 'Que souhaitez-vous faire ?',
        choices: [
          {label: 'Tout activer', value: 'all'},
          {label: 'Tout retirer', value: 'none'},
        ],
      },
      {
        id: 'confirm',
        type: 'confirm',
        prompt: d => `Appliquer ces droits par défaut ?\n\n${recapRights(d)}`,
      },
    ],
  },
  {
    id: 'setphoto',
    label: 'setphoto',
    title: 'Photo du bot',
    keywords: ['photo', 'image', 'avatar'],
    menuLabel: 'Photo du bot',
    description: 'Photo de profil',
    longDescription:
      'La photo se change depuis l’onglet Profil du bot (appui sur la photo).',
    unsupported: true,
    steps: [
      {
        id: 'info',
        type: 'info',
        prompt:
          'La photo se change depuis l’onglet Profil du bot : touchez la photo, puis « Changer la photo ».',
      },
    ],
  },
];
