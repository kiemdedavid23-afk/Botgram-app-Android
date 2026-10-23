# LIVRAISONS - Mini-purge R10

## Mini-purge R10 — composants partagés + navigation

### a) Tableaux valeur en dur → métrique → source CSS

#### BrandBar.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| letterSpacing -0.3 | brandBarMetrics.titleLetterSpacing | BrandBar.css titre |
| gap 8 | brandBarMetrics.rightGap | BrandBar.css actions gap 8 |

#### BottomNav.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| zIndex 100 | navMetrics.zIndex | sans équivalent site (pile RN) |
| borderWidth 1 | navMetrics.borderWidth | BottomNav.css border |
| gap 2 | navMetrics.itemGap | BottomNav.css .nav-item gap |
| opacity 0.7 | navMetrics.itemPressedOpacity | sans équivalent site (press) |
| 0.01 × navLabel | navMetrics.labelLetterSpacingFactor | Design tokens §4 |
| left/right/bottom 0 | navMetrics.edge | BottomNav.css fixed bottom |

#### BotBottomNav.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| (mêmes que BottomNav) | navMetrics.* | idem |
| badge top -6 / right -10 | badgeOffsetTop/Right | sans équivalent site |
| badge pad H 4 | badgePadH | BottomNav badge |
| avatar outer 28 / margin -2 | avatarOuterSize / avatarOuterMargin | BotBottomNav ring |
| borderWidth 2 | avatarRingBorder | BotBottomNav |
| borderColor transparent | navMetrics.transparent | ring inactif |

#### SettingsShell.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| back 36×36 | shellMetrics.backBtnSize | settings-common.css header |
| icon 22 | shellMetrics.backIconSize | settings-common.css |
| hitSlop 8 | shellMetrics.backHitSlop | sans équivalent site (a11y) |
| fontWeight 600 | shellMetrics.titleWeight | settings-common.css |
| borderBottomWidth 1 | shellMetrics.headerBorderWidth | settings-common.css |

#### EmptyScreen.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| paddingHorizontal 24 | emptyScreenMetrics.padH | Design tokens space.lg |
| marginTop 8 | emptyScreenMetrics.subtitleMarginTop | Design tokens space.sm |
| -0.02 × pageHeader | titleLetterSpacingFactor | Design tokens §4 |

#### AuthFab.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| shadowOpacity 1 | authMetrics.fabShadowOpacity | Auth.css .auth-fab |
| shadowRadius 14 | authMetrics.fabShadowRadius | Auth.css |
| shadowOffset 0,4 | fabShadowOffsetX/Y | Auth.css |
| elevation 6 | authMetrics.fabElevation | Auth.css / Android |
| opacity 0.5 | authMetrics.fabDisabledOpacity | sans équivalent site |
| icon size 26 | authMetrics.fabIconSize | Auth.css |

#### AuthHeader.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| paddingHorizontal 4 | shellMetrics.authPadH | Auth.css head |
| back 36×36 | shellMetrics.backBtnSize | Auth.css |
| fontSize 20 | shellMetrics.authTitleSize | Auth.css |
| fontWeight 600 | shellMetrics.titleWeight | Auth.css |
| marginRight 36 | shellMetrics.authTitleMarginRight | Auth.css |
| hitSlop 12 | shellMetrics.authBackHitSlop | valeur app d'origine |
| icon 24 | shellMetrics.authBackIconSize | valeur app d'origine |

#### RootNavigator.tsx
| valeur d'origine | clé | source |
|------------------|-----|--------|
| banner padding 12 | rootNavigatorMetrics.bannerPadding | proche sheet section |
| marginHorizontal 22 | rootNavigatorMetrics.logoutMarginH | Auth.css bodyPaddingH |
| paddingVertical 14 | rootNavigatorMetrics.logoutPadV | Auth.css fieldPaddingV |

#### botProfileMetrics.ts (correctif visuel unique)
| valeur d'origine | clé | source |
|------------------|-----|--------|
| heroNameWeight 700 → 800 | heroNameWeight | BotProfile.css:113 font-weight 800 |

### b) Textes déplacés
aucun (aucun texte visible en dur ajouté ou déplacé dans ce patch)

### c) Fichiers à supprimer
aucun

### d) Écarts signalés
1. SettingsShell / AuthHeader : hitSlop et taille d’icône différents (8/22 vs 12/24) — conservés via clés séparées pour pixel-perfect app.
2. zIndex 100, opacités press/disabled, offsets badge : sans équivalent CSS site, justifiés (pile RN / feedback / pastille).
3. `flex: 1` conservé (layout RN, hors liste R10 tailles/marges/couleurs).

### Fichiers livrés (chemins complets)
| Chemin | Action |
|--------|--------|
| `src/shared/theme/navMetrics.ts` | créé |
| `src/shared/theme/brandBarMetrics.ts` | créé |
| `src/shared/theme/shellMetrics.ts` | créé |
| `src/shared/theme/emptyScreenMetrics.ts` | créé |
| `src/shared/theme/rootNavigatorMetrics.ts` | créé |
| `src/shared/theme/authColors.ts` | modifié (fusion + fab shadow) |
| `src/shared/theme/index.ts` | modifié (exports) |
| `src/shared/theme/botProfileMetrics.ts` | modifié (heroNameWeight 800) |
| `src/shared/components/BrandBar.tsx` | modifié |
| `src/shared/components/BottomNav.tsx` | modifié |
| `src/shared/components/BotBottomNav.tsx` | modifié |
| `src/shared/components/SettingsShell.tsx` | modifié |
| `src/shared/components/EmptyScreen.tsx` | modifié |
| `src/shared/components/AuthFab.tsx` | modifié |
| `src/features/auth/components/AuthHeader.tsx` | modifié |
| `src/app/RootNavigator.tsx` | modifié |
| `LIVRAISONS.md` | modifié |

### Clés supprimées ou renommées
aucune
