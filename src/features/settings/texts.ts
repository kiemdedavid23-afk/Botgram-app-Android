/** Textes réglages stockage (fr). */
export const settingsStorageTexts = {
  title: 'Stockage',
  spaceUsed: 'Espace utilisé',
  mediaFiles: 'Médias locaux',
  archiveDb: 'Archive messages',
  clearMedia: 'Vider les médias',
  clearConfirmTitle: 'Vider les médias locaux ?',
  clearConfirmBody:
    'Supprime les fichiers médias téléchargés ou envoyés sur cet appareil. Les messages et textes restent. Les médias pourront être retéléchargés si le serveur les a encore.',
  clearConfirmOk: 'Vider',
  clearConfirmCancel: 'Annuler',
  clearDone: 'Médias locaux vidés.',
  unavailable: 'Indisponible',
  bytes: (n: number) => {
    if (n < 1024) return `${n} o`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} Ko`;
    return `${(n / (1024 * 1024)).toFixed(1)} Mo`;
  },
};
