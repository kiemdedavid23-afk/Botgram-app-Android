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
