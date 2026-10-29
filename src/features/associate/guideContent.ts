/**
 * Contenu du guide « Associer son bot Telegram à Botgram ».
 * Embarqué dans l'app : lisible sans connexion.
 * Marques inline : **gras**, *italique*, `code`.
 */

export type GuideBlock =
  | {t: 'p'; text: string}
  | {t: 'h3'; text: string}
  | {t: 'ul'; items: string[]}
  | {t: 'ol'; items: string[]}
  | {t: 'note'; tone: 'info' | 'warn'; title?: string; text: string}
  | {t: 'code'; text: string}
  | {t: 'table'; head: string[]; rows: string[][]}
  | {t: 'faq'; q: string; a: string};

export type GuideSectionId =
  | 'idee'
  | 'prerequis'
  | 'creer'
  | 'jeton'
  | 'perso'
  | 'associer'
  | 'tester'
  | 'revoquer'
  | 'deconnecter'
  | 'conserve'
  | 'faq'
  | 'memo';

export type GuideSection = {
  id: GuideSectionId;
  title: string;
  blocks: GuideBlock[];
};

export const GUIDE_INTRO =
  'Ce guide vous accompagne pas à pas, depuis la création de votre bot sur Telegram jusqu’à sa connexion à Botgram. Aucune connaissance technique n’est nécessaire. Comptez une dizaine de minutes la première fois.';

export const GUIDE_SECTIONS: ReadonlyArray<GuideSection> = [
  {
    id: 'idee',
    title: 'Comprendre l’idée en une minute',
    blocks: [
      {
        t: 'p',
        text: 'Un **bot Telegram** est un compte automatisé, que les gens peuvent contacter sur Telegram comme n’importe quel autre contact. Avec Botgram, c’est **vous** qui répondez à leurs messages, depuis un seul endroit : l’application.',
      },
      {t: 'p', text: 'Pour que cela fonctionne, il faut :'},
      {
        t: 'ol',
        items: [
          '**Créer un bot** sur Telegram (c’est gratuit et c’est Telegram qui le fait).',
          '**Récupérer le jeton** de ce bot : un long code qui prouve que le bot est bien à vous.',
          '**Coller ce jeton dans Botgram**, qui relie alors votre bot à votre compte.',
        ],
      },
      {
        t: 'note',
        tone: 'info',
        title: 'Bon à savoir',
        text: 'Botgram ne crée pas le bot à votre place. Seul Telegram peut le faire, et il le fait par l’intermédiaire d’un robot officiel appelé **BotFather**. C’est ce que nous allons utiliser.',
      },
    ],
  },
  {
    id: 'prerequis',
    title: 'Ce qu’il vous faut avant de commencer',
    blocks: [
      {
        t: 'ul',
        items: [
          'Un **compte Telegram** (application sur téléphone, ordinateur ou version web). La création d’un bot se fait depuis un compte Telegram, avec votre numéro de téléphone.',
          'Un **compte Botgram** dont l’adresse e-mail est confirmée.',
          'Un **nom** et un **identifiant** en tête pour votre bot (les règles sont plus bas).',
        ],
      },
    ],
  },
  {
    id: 'creer',
    title: 'Créer votre bot sur Telegram',
    blocks: [
      {t: 'h3', text: 'Étape 1 — Ouvrir BotFather'},
      {
        t: 'ol',
        items: [
          'Ouvrez Telegram.',
          'Dans la barre de recherche, tapez **BotFather**.',
          'Choisissez le résultat portant le **badge bleu de vérification** ✔. C’est le seul officiel : il en existe des imitations, ne les utilisez jamais.',
          'Appuyez sur **Démarrer** (ou envoyez `/start`).',
        ],
      },
      {t: 'p', text: 'BotFather répond avec la liste de ses commandes.'},
      {t: 'h3', text: 'Étape 2 — Demander un nouveau bot'},
      {t: 'p', text: 'Envoyez le message :'},
      {t: 'code', text: '/newbot'},
      {
        t: 'p',
        text: 'BotFather vous pose alors deux questions, l’une après l’autre.',
      },
      {t: 'h3', text: 'Étape 3 — Choisir le nom du bot'},
      {
        t: 'p',
        text: 'BotFather demande : *« Comment voulez-vous appeler votre bot ? »*',
      },
      {
        t: 'p',
        text: 'C’est le **nom affiché** dans les conversations, par exemple « Boutique Awa ». Vous pouvez y mettre des espaces, des accents, des majuscules, et vous pourrez le changer plus tard. Plusieurs bots peuvent porter le même nom.',
      },
      {t: 'h3', text: 'Étape 4 — Choisir l’identifiant du bot'},
      {
        t: 'p',
        text: 'BotFather demande ensuite un **identifiant** (aussi appelé « nom d’utilisateur »). Il apparaît sous la forme `@boutique_awa_bot` et sert de lien public. Les règles sont strictes :',
      },
      {
        t: 'table',
        head: ['Règle', 'Valide', 'Refusé'],
        rows: [
          [
            'Doit **se terminer par `bot`**',
            '`boutique_awa_bot`',
            '`boutique_awa`',
          ],
          ['Entre **5 et 32** caractères', '`awa_shop_bot`', '`a_bot` (trop court)'],
          [
            'Lettres **sans accent**, chiffres et tiret bas `_` uniquement',
            '`awa2026_bot`',
            '`awa-shop_bot`, `awà_bot`',
          ],
          ['Doit être **encore libre**', '—', 'Un identifiant déjà pris'],
        ],
      },
      {
        t: 'p',
        text: 'Si l’identifiant est pris ou invalide, BotFather le dit : proposez-en un autre jusqu’à ce que cela fonctionne.',
      },
      {
        t: 'note',
        tone: 'warn',
        title: 'Attention',
        text: 'L’identifiant ne peut pas être changé librement après coup. Choisissez-le avec soin.',
      },
      {t: 'h3', text: 'Étape 5 — C’est créé : votre jeton apparaît'},
      {
        t: 'p',
        text: 'BotFather confirme la création avec un message qui ressemble à ceci :',
      },
      {
        t: 'code',
        text: 'Done! Congratulations on your new bot. You will find it at t.me/boutique_awa_bot.\n...\nUse this token to access the HTTP API:\n123456789:AAH-exemple_de_jeton_a_ne_jamais_partager\nKeep your token secure and store it safely...',
      },
      {
        t: 'p',
        text: 'La ligne en gros caractères, **deux nombres séparés par deux-points suivis de lettres**, est votre **jeton**. C’est lui dont Botgram a besoin. Un jeton ressemble toujours à ceci : des chiffres, deux-points, puis des lettres, chiffres, tirets et tirets bas.',
      },
      {t: 'code', text: '123456789:AAH-exemple_de_jeton_a_ne_jamais_partager'},
    ],
  },
  {
    id: 'jeton',
    title: 'Récupérer et copier votre jeton',
    blocks: [
      {t: 'h3', text: 'Le copier tout de suite'},
      {
        t: 'ol',
        items: [
          'Dans le message de BotFather, **appuyez longuement** sur la ligne du jeton (sur téléphone), ou faites un **clic droit** puis *Copier* (sur ordinateur).',
          'Si Telegram ne sélectionne que la moitié, sélectionnez la ligne en entier : le jeton va **du premier chiffre au dernier caractère**, sans espace.',
        ],
      },
      {
        t: 'note',
        tone: 'info',
        title: 'Astuce',
        text: 'Sur Telegram, toucher directement la ligne du jeton le copie souvent en un seul geste.',
      },
      {t: 'h3', text: 'Le retrouver plus tard'},
      {
        t: 'p',
        text: 'Vous avez perdu le message ? Pas de panique, le jeton reste disponible :',
      },
      {
        t: 'ol',
        items: [
          'Ouvrez la conversation avec **BotFather**.',
          'Envoyez `/mybots`.',
          'Choisissez votre bot dans la liste.',
          'Appuyez sur **API Token**.',
        ],
      },
      {t: 'p', text: 'BotFather vous réaffiche le jeton.'},
      {t: 'h3', text: 'Ce qu’il ne faut jamais faire avec le jeton'},
      {
        t: 'p',
        text: 'Le jeton est **la clé de votre bot**. Quiconque le possède peut lire ses messages et écrire à sa place.',
      },
      {
        t: 'ul',
        items: [
          'Ne le publiez **jamais** (réseaux sociaux, groupes, captures d’écran).',
          'Ne l’envoyez à personne, même à quelqu’un qui prétend être du « support ».',
          'Ne le collez que dans **Botgram** et nulle part ailleurs.',
          'Si vous pensez qu’il a fuité, **changez-le immédiatement** (voir « Changer ou révoquer un jeton »).',
        ],
      },
    ],
  },
  {
    id: 'perso',
    title: 'Personnaliser votre bot (facultatif)',
    blocks: [
      {
        t: 'p',
        text: 'Avant de le relier, vous pouvez donner une vraie identité à votre bot. Toutes ces commandes se tapent dans la conversation avec BotFather : envoyez la commande, choisissez le bot, puis suivez les instructions.',
      },
      {
        t: 'table',
        head: ['Commande', 'À quoi ça sert'],
        rows: [
          ['`/setname`', 'Changer le nom affiché'],
          ['`/setuserpic`', 'Ajouter une photo de profil'],
          [
            '`/setdescription`',
            'Le texte affiché à l’ouverture de la conversation, avant d’écrire',
          ],
          ['`/setabouttext`', 'Le court texte du profil du bot'],
          [
            '`/setcommands`',
            'Proposer un menu de commandes (ex. `catalogue`, `horaires`)',
          ],
        ],
      },
      {
        t: 'p',
        text: 'Vous pourrez aussi modifier une partie de ces informations plus tard depuis Botgram.',
      },
    ],
  },
  {
    id: 'associer',
    title: 'Associer le bot dans Botgram',
    blocks: [
      {t: 'p', text: 'Une fois votre jeton copié :'},
      {
        t: 'ol',
        items: [
          'Dans Botgram, ouvrez le **tableau de bord**, puis appuyez sur **Ajouter un bot** et choisissez **Associer un bot existant**.',
          '**Collez le jeton** dans le champ prévu.',
          'Botgram vérifie le jeton et vous **présente le bot trouvé** : son nom et son identifiant. Vérifiez que c’est bien le vôtre.',
          'Si Botgram vous signale que ce bot est **déjà relié à un autre service**, il vous demande de **confirmer le remplacement**. Acceptez seulement si vous savez que ce bot ne doit plus servir ailleurs : cet autre service cessera alors de recevoir les messages.',
          'Validez. Le bot apparaît dans votre liste avec l’état **Connecté**.',
        ],
      },
      {
        t: 'p',
        text: 'C’est terminé. Dès que quelqu’un écrira à votre bot, la conversation apparaîtra dans Botgram.',
      },
      {t: 'h3', text: 'Les règles à connaître'},
      {
        t: 'ul',
        items: [
          '**2 bots actifs au maximum** par compte.',
          'Un même bot ne peut être relié qu’à **un seul compte Botgram** à la fois.',
          'Vous pouvez garder jusqu’à **10 fiches de bots** (actifs ou déconnectés) par compte.',
          'Votre jeton est **conservé de façon sécurisée** et **n’est jamais réaffiché** après l’association.',
        ],
      },
    ],
  },
  {
    id: 'tester',
    title: 'Tester que tout fonctionne',
    blocks: [
      {
        t: 'ol',
        items: [
          'Sur Telegram, ouvrez votre bot (par son lien `t.me/identifiant_bot` ou par la recherche).',
          'Appuyez sur **Démarrer** puis envoyez un message, par exemple « Bonjour ».',
          'Dans Botgram, ouvrez votre bot : la conversation apparaît.',
          'Répondez : votre message arrive dans Telegram, envoyé par le bot.',
        ],
      },
      {t: 'h3', text: 'Deux choses importantes à savoir'},
      {
        t: 'ul',
        items: [
          '**Un bot ne peut jamais écrire le premier.** Telegram exige que la personne ait d’abord ouvert le bot et appuyé sur **Démarrer** (ou lui ait écrit). Tant que ce n’est pas fait, aucune conversation n’existe.',
          '**Les groupes** : vous pouvez ajouter votre bot à un groupe. Par défaut, un bot de groupe ne voit que les commandes et les messages qui lui sont adressés. Pour qu’il voie tous les messages, réglez-le avec `/setprivacy` dans BotFather (choisissez *Disable*). Si vous ne voulez pas qu’on l’ajoute à des groupes, utilisez `/setjoingroups`.',
        ],
      },
    ],
  },
  {
    id: 'revoquer',
    title: 'Changer ou révoquer un jeton',
    blocks: [
      {
        t: 'p',
        text: 'Si votre jeton a été exposé, ou si vous voulez simplement le renouveler :',
      },
      {
        t: 'ol',
        items: [
          'Dans BotFather, envoyez `/mybots` et choisissez le bot.',
          'Appuyez sur **API Token**, puis **Revoke current token**.',
          'BotFather génère un **nouveau jeton** et l’ancien cesse de fonctionner immédiatement.',
          'Revenez dans Botgram : la connexion de ce bot signalera un jeton invalide. Déconnectez-le, puis **ré-associez-le avec le nouveau jeton**.',
        ],
      },
    ],
  },
  {
    id: 'deconnecter',
    title: 'Déconnecter ou supprimer un bot',
    blocks: [
      {
        t: 'ul',
        items: [
          '**Déconnecter** : Botgram cesse de recevoir les messages du bot, **efface son historique** de conversations et oublie son jeton. Votre bot continue d’exister sur Telegram et **son jeton n’est pas révoqué** : faites-le vous-même avec BotFather si besoin.',
          '**Supprimer la fiche** : possible uniquement après la déconnexion. Elle libère une place dans votre compte.',
          'Vous pouvez réassocier le même bot plus tard avec son jeton.',
        ],
      },
    ],
  },
  {
    id: 'conserve',
    title: 'Ce que Botgram conserve',
    blocks: [
      {
        t: 'ul',
        items: [
          'Les messages sont **gardés 30 jours**, puis supprimés automatiquement.',
          'Le nombre de messages envoyés est limité à **165 par jour** et par compte, tous bots confondus. Le compteur repart à zéro chaque jour à minuit (heure UTC).',
          'Vos pièces jointes ne sont pas copiées : elles sont récupérées chez Telegram au moment où vous les ouvrez.',
        ],
      },
    ],
  },
  {
    id: 'faq',
    title: 'Questions fréquentes et dépannage',
    blocks: [
      {
        t: 'faq',
        q: 'Jeton invalide',
        a: 'Vérifiez qu’il est complet, sans espace ni retour à la ligne, et qu’il a bien la forme `chiffres:lettres`. S’il a été révoqué entre-temps, reprenez le jeton actuel avec `/mybots` puis **API Token**.',
      },
      {
        t: 'faq',
        q: 'Ce bot est déjà associé à un compte',
        a: 'Un bot ne peut appartenir qu’à un compte à la fois. S’il est à vous, déconnectez-le de l’autre compte. Si vous ne reconnaissez pas cette association, révoquez le jeton : cela coupe tout accès.',
      },
      {
        t: 'faq',
        q: 'Maximum de bots atteint',
        a: 'Vous avez déjà 2 bots actifs. Déconnectez-en un pour en ajouter un nouveau.',
      },
      {
        t: 'faq',
        q: 'Ce bot utilise déjà une connexion existante',
        a: 'Le bot est déjà relié à un autre outil. Confirmez le remplacement seulement si vous êtes sûr, car cet outil ne recevra plus rien.',
      },
      {
        t: 'faq',
        q: 'L’état du bot affiche une erreur de connexion',
        a: 'Utilisez l’action **Réessayer la connexion**. Si le problème persiste, vérifiez le jeton.',
      },
      {
        t: 'faq',
        q: 'Un message envoyé est resté « en attente »',
        a: 'Telegram était momentanément indisponible. Utilisez le bouton **Réessayer** à côté du message, quelques minutes plus tard.',
      },
      {
        t: 'faq',
        q: 'Un contact ne reçoit pas mes messages',
        a: 'Il a peut-être bloqué le bot, ou n’a jamais appuyé sur **Démarrer**. Dans ces deux cas, Telegram refuse l’envoi.',
      },
      {
        t: 'faq',
        q: 'Je ne vois aucune conversation',
        a: 'Personne n’a encore écrit au bot. Envoyez-lui un message depuis votre propre compte Telegram pour tester.',
      },
      {
        t: 'faq',
        q: 'Je ne peux pas associer de bot',
        a: 'Vérifiez que l’adresse e-mail de votre compte est confirmée et que vous n’avez pas fait trop de tentatives d’affilée : patientez un peu avant de réessayer.',
      },
    ],
  },
  {
    id: 'memo',
    title: 'Mémo : les 8 gestes à retenir',
    blocks: [
      {
        t: 'ol',
        items: [
          'Telegram → chercher **BotFather** (badge bleu ✔).',
          'Envoyer `/newbot`.',
          'Choisir un **nom**.',
          'Choisir un **identifiant** terminé par `bot`.',
          '**Copier le jeton** donné par BotFather.',
          'Botgram → tableau de bord → **Ajouter un bot** → coller le jeton.',
          'Vérifier le bot présenté et **valider**.',
          'Écrire au bot depuis Telegram pour **tester**.',
        ],
      },
      {
        t: 'note',
        tone: 'warn',
        title: 'Rappel de sécurité',
        text: 'Votre jeton est un secret. Ne le partagez jamais, et révoquez-le sans attendre au moindre doute.',
      },
    ],
  },
];
