/**
 * Dimensions du héros profil bot (actions, badge photo, statut, progression).
 * Valeurs estimées d'après la capture du site (écran 720 px = 360 dp, facteur 2).
 */
export const botHeroMetrics = {
  actionSize: 34, actionRadius: 10, actionGap: 7, actionIcon: 18,
  actionsTop: 14, actionsRight: 14,
  cameraSize: 30, cameraIcon: 16, cameraOffset: 0,
  statusPadV: 5, statusPadH: 14, statusGap: 8, statusDot: 8, statusFont: 13,
  progressHeight: 5, progressGap: 12, progressFont: 13, progressMissingFont: 12,
  progressTrackAlpha: 0.3,
  decoSize: 200, decoTop: -60, decoRight: -50,
  decoColor: 'rgba(255,255,255,0.10)',
  disabledOpacity: 0.5,
} as const;
