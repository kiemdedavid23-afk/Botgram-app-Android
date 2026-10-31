/** Textes français — mises à jour de l'application. */
export const updateTexts = {
  blockedTitle: 'Mise à jour requise',
  blockedBody: 'Une nouvelle version de Botgram est nécessaire pour continuer.',
  version: (v: string) => `Version : ${v}`,
  notes: 'Nouveautés',
  update: 'Mettre à jour',
  checkAgain: 'Vérifier de nouveau',
  checking: 'Vérification…',
  noLink: 'Le lien de téléchargement est momentanément indisponible. Réessayez dans un instant.',
  openFailed: "Impossible d'ouvrir le lien de téléchargement.",
  bannerTitle: 'Nouvelle version disponible',
  bannerVersion: (v: string) => `Botgram ${v} est prête.`,
  bannerBody: 'Une mise à jour est disponible.',
  later: 'Plus tard',
  settingsTitle: 'Mises à jour',
  settingsCurrent: (v: string, b: number) => `Version ${v} (build ${b})`,
  settingsChecking: 'Recherche en cours…',
  settingsUpToDate: (v: string) => `Vous avez la dernière version (${v})`,
  settingsAvailable: (v: string | null) =>
    v ? `Version ${v} disponible — appuyez pour mettre à jour` : 'Mise à jour disponible — appuyez pour mettre à jour',
  settingsFailed: 'Impossible de vérifier. Appuyez pour réessayer.',
} as const;
