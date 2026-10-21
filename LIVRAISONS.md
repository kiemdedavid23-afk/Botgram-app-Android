# Livraisons

## L3a — Tableau de bord + Ajouter un bot

### Fichiers

| Fichier | Avant → Après | Raison |
|---|---|---|
| `src/shared/theme/colors.ts` | +`warn` | #f59e0b (DashboardPage.css arc ≥65%) |
| `src/shared/theme/dashboardMetrics.ts` | 0 → 103 | dimensions CSS → tokens |
| `src/shared/theme/index.ts` | export metrics | |
| `src/shared/components/SettingsShell.tsx` | 0 → 75 | en-tête sous-page |
| `src/shared/components/index.ts` | +SettingsShell | |
| `src/features/dashboard/logic.ts` | 0 → 82 | salutation, quota, memberSince, connected |
| `src/features/dashboard/texts.ts` | 28 → 66 | libellés FR |
| `src/features/dashboard/components/*` | 0 | Hero, BotSlot, Quota, Account, Section |
| `src/features/dashboard/screens/DashboardScreen.tsx` | 69 → 173 | écran complet |
| `src/features/dashboard/index.ts` | export | |
| `src/features/bots/screens/AddBotScreen.tsx` | 0 → 117 | une carte Associer |
| `src/app/RootNavigator.tsx` | 171 → 209 | MemberStack Tabs/AddBot |
| `__tests__/dashboard-logic.test.ts` | 0 → 81 | cas limites |

### Table valeur site → app

| Bloc site | Fichier app |
|---|---|
| .dash padding 14/32 gap 22 | dashboardMetrics.page* / sectionGap |
| .dash-hero radius 28 minH 250 pad 30 24 24 | hero* |
| orbes 240/180 | orbA/orbB + HeroCard SVG |
| salutation 32/800 | greetSize + logic.greetingWord |
| pastilles blanc 18% | HeroCard chip (repli flou documenté) |
| Mes bots label 12/700 | SectionHeader |
| carte bot 48 icon radius 16 | BotCard |
| connecté = connected\|webhook_error\|token_invalid | logic.isBotConnected |
| quota anneau r36 stroke 8 | QuotaCard |
| vert/orange/rouge 65/90 | logic.quotaTone + colors.warn |
| Mon compte Standard/Actif | AccountCard textes statiques |
| memberSince | logic.memberSince (mois FR fixes) |
| SettingsShell header | SettingsShell.tsx |
| AddBot carte Link2 | AddBotScreen |

### Écarts demandés / documentés
- Pastille bots **sans** « /limite » (Worker décide).
- Quota : pas de 165 en dur ; « – » / « … » si non chargé.
- Icône bot : fond accentSoft (approx. dégradé site).
- Ombre héros : elevation 8 / 10 (approx. 0 12 28 −12).
- Pastilles héros : pas de backdrop-filter → fond rgba blanc 18 %.

### Non fait
- Parcours d'association (L3b) : appui carte Associer **inerte**.
- Gestion bot / profil (L3c), Demandes de création, messagerie.
- BrandBar / BottomNav / BotBottomNav non modifiés.

### Preuve CI attendue
typecheck 0, lint 0, jest vert (dont dashboard-logic).

## L3a — correctif typecheck (AssociateToken + BotSlot)

### Fichiers modifiés / ajoutés
| Fichier | Avant → Après |
|---|---|
| `src/features/associate/screens/AssociateTokenScreen.tsx` | nouveau (import `../../bots`, texts associate) |
| `src/features/bots/index.ts` | ré-export useAssociateStore |
| `src/features/dashboard/components/BotSlot.tsx` | +styles.statusOn / statusOff |

### Fichiers à supprimer
- `src/features/bots/screens/AssociateTokenScreen.tsx` (déplacé vers `features/associate/screens/AssociateTokenScreen.tsx`)

## L3a — correctif R10 tokens / bordures / orbes

### Fichiers modifiés
| Fichier | Changement |
|---|---|
| `src/shared/theme/colors.ts` | +borderSoft, accentSoft24, hero* |
| `src/shared/theme/dashboardMetrics.ts` | orbes float, gaps, weights, press |
| `HeroCard.tsx` | tokens + db-float exact |
| `BotSlot.tsx` | borderSoft, gradient icon, press AddBotSlot, no statusOn/Off |
| `QuotaCard.tsx` / `AccountCard.tsx` | borderSoft, tokens |
| `AddBotScreen.tsx` | colors.white |
| `DashboardScreen.tsx` | sectionInnerGap |
| `SectionHeader.tsx` | metrics |

### Tableau propriété | site | app

**HeroCard**
| propriété | site (DashboardPage.css) | app |
|---|---|---|
| radius / minH / pad | l.27-29 28 / 250 / 30 24 24 | heroRadius, heroMinHeight, heroPadding* |
| orbe A float | l.52-53, l.64-66 7s translate(-10,12) | orbADurationMs, orbFloatX/Y |
| orbe B | l.55-61 9s reverse -3s | orbBDurationMs, reverse phase |
| chips bg/border | l.115-116 rgba white 0.18/0.24 | heroChipBg, heroChipBorder |
| text | l.33 #fff, l.97 0.9 | heroText, heroTextMuted |

**BotSlot**
| propriété | site | app |
|---|---|---|
| border | l.179 color-mix border 55% | borderSoft |
| icon gradient | l.213 145deg accent-soft → 24% | accentSoft + accentSoft24 GradientView |
| empty border | l.199-200 2 dashed border, no shadow | emptyBorderW, borderStyle dashed |
| press | l.195 scale 0.985 0.15s | pressScale, pressDurationMs |

**QuotaCard / AccountCard**
| propriété | site | app |
|---|---|---|
| border | l.162 color-mix 55% | borderSoft |
| Actif soft | l.277 rgba(10,198,48,.12) | onlineSoft |

**AddBotScreen**
| propriété | site (AddBotPage.css) | app |
|---|---|---|
| icon white | l.73 color white | colors.white |
| press scale | l.38 0.985 | pressScale |

### Fichiers à supprimer
aucun

## L3a-fix — textHint / tokens 02-DESIGN-TOKENS.md

### Fichiers modifiés
| Fichier | Avant → Après |
|---|---|
| `src/shared/theme/colors.ts` | textHint clair `#999999` ; accentSoft clair `rgba(51,144,236,0.12)` ; bubbleOut clair `#eeffde` |

### Alignement 02-DESIGN-TOKENS.md
| Token | Clair | Sombre |
|---|---|---|
| textHint | `#999999` | `#6c6c6c` |
| accentSoft | `rgba(51,144,236,0.12)` | `rgba(94,179,246,0.15)` |
| bubbleOut | `#eeffde` | `#2b5278` |

Tokens ajoutés (source CSS) : borderSoft (DashboardPage.css l.162), accentSoft24 (l.213), onlineSoft (l.277), divider (settings-common), hero*, warn (quota).

### Fichiers à supprimer
aucun
