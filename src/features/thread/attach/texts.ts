/** Textes français — panneau de pièces jointes. */
export const attachTexts = {
  tabGallery: 'Galerie',
  tabFile: 'Fichier',
  tabLocation: 'Position',
  tabContact: 'Contact',
  soon: 'Bientôt',
  // Galerie
  galleryEmpty: 'Aucune photo ni vidéo trouvée.',
  accessTitle: 'Accès à vos photos et vidéos',
  accessBody:
    'Pour choisir vos photos et vidéos ici, autorisez Botgram à les lire. Elles ne quittent votre téléphone que lorsque vous les envoyez.',
  accessAllow: 'Autoriser l’accès',
  accessOpenSettings: 'Ouvrir les réglages',
  accessFallback: 'Choisir avec le sélecteur Android',
  limitedTitle: 'Accès limité',
  limitedBody: 'Seules les photos que vous avez autorisées sont affichées.',
  limitedManage: 'Gérer',
  tooLarge: 'Trop volumineux (10 Mo max.)',
  maxItems: (n: number) => `${n} éléments maximum par envoi`,
  // Caméra
  cameraDenied: 'Autorisez la caméra pour prendre une photo.',
  cameraOpenSettings: 'Ouvrir les réglages',
  cameraFailed: 'Impossible de prendre la photo.',
  cameraClose: 'Fermer la caméra',
  cameraShutter: 'Prendre la photo',
  cameraFlip: 'Changer de caméra',
  cameraFlash: 'Flash',
  // Fichier
  fileBrowse: 'Choisir un fichier',
  fileBrowseSub: 'Parcourir les fichiers de votre téléphone',
  fileHint: 'Vous pouvez en choisir plusieurs. Ils seront ajoutés à votre message.',
  // Barre du bas
  captionPlaceholder: 'Ajouter une légende…',
  send: 'Envoyer',
  sendCount: (n: number) => `Envoyer (${n})`,
  close: 'Fermer',
} as const;
