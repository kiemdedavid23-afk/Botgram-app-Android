# LIVRAISONS — L3b parcours association

## Fichiers créés / modifiés
| Fichier | Rôle |
|---|---|
| `src/features/associate/store/associateStore.ts` | store (mémoire, AppState) |
| `src/features/associate/texts.ts` | textes FR |
| `src/features/associate/index.ts` | exports |
| `src/features/associate/components/AssociateShell.tsx` | en-tête + étapes |
| `src/features/associate/screens/Associate*.tsx` | 6 écrans |
| `src/features/associate/AssociateStackScreens.tsx` | wrappers nav |
| `src/shared/theme/associateMetrics.ts` | dimensions |
| `src/shared/theme/colors.ts` | +success* |
| `src/shared/theme/index.ts` | export metrics |
| `src/app/RootNavigator.tsx` | routes Associate* |
| `src/features/bots/screens/AddBotScreen.tsx` | câble onAssociate |
| `src/features/bots/index.ts` | re-export depuis associate |
| `__tests__/associate-store.test.ts` | tests store |

## Tableaux site → app

### Shell
| propriété | site (AssociateFlow.css) | app |
|---|---|---|
| head pad / title | l.14-24 12 16 / 18/600 | headPad*, headTitle* |
| progress dots | l.27-48 gap 6 h 4 | progress* |
| body | l.51-58 20 16 32 gap 16 | bodyPad*, bodyGap |

### Intro
| propriété | site | app |
|---|---|---|
| 4 points + icônes | AssociateIntroPage POINTS | texts.point1-4 + lucide |
| case à cocher | l.assoc__check | acknowledged store |
| ok #1b7f3a | .assoc__ok | colors.success / successSoft |

### Token
| propriété | site | app |
|---|---|---|
| jeton mémoire | store token | token null après succès / AppState |
| autofill off | autoComplete off | autoComplete="off" importantForAutofill=no |

## Fichiers à supprimer
- `src/features/bots/store/associateStore.ts` (déplacé vers `features/associate/store/associateStore.ts`)

## Écarts connus
- Lien « Consulter le guide complet » **inerte** (guide non présent dans l’app).
- Création de bot (parcours « Nouveau ») hors périmètre L3b.
- `#fff7e6` / banner démo : fond dérivé de `colors.warn` (pas de copie brute #fff7e6).
