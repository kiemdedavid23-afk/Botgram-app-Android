# LIVRAISONS — L4b Profil Telegram du bot (partie 1/2)

## Navigation
Route **MemberStack `BotProfile`**, entrée **Paramètres → Profil du bot**.

## Dette soldée
- GestionScreen → BotsSection (≤300)
- EditProfileSheet → styles extraits (`editProfileSheetStyles.ts`)
- ProfileSections → ProfileSessionSection
- DeleteAccountDialog → mapDeleteError extrait (`deleteErrors.ts`)

## Périmètre L4b
- États : aucun bot, chargement, erreur + réessayer
- Héros + photo via `buildBotPhotoSource` (Bearer dans core/api uniquement)
- Onglets Identité / Langues / Infos (pas Commandes/Menu/Droits)
- Draft/saved, SaveBar, report, 429
- Types complets (commands/menu/rights) pour L4c sans UI

## Fichiers créés (principaux)
- `src/core/api/endpoints/botProfile.types.ts`, `botProfile.ts`
- `src/features/botprofile/**`
- `src/shared/theme/botProfileMetrics.ts`
- `__tests__/bot-profile.test.ts`
- dette : `BotsSection`, `ProfileSessionSection`, `editProfileSheetStyles`, `deleteErrors`

## Fichiers à supprimer
aucun

## Tableaux site → app

### Héros (BotProfile.css)
| propriété | site | app |
|---|---|---|
| min-height 300, radius 22 | .bp-hero | botProfileMetrics.hero* |
| avatar 104 | --hero-avatar | heroAvatar |
| dégradé | brandHero / dark | gradients.brandHero* |

### Suppression compte (L3c, MemberProfilePage.css)
| propriété | site | app |
|---|---|---|
| max-width 360 r22 | .mp-dialog | memberProfileMetrics.dialog* |
| overlay | rgba(0,0,0,.45) | colors.overlay |

### Réglages (settings-list.css)
| propriété | site | app |
|---|---|---|
| card r18 m12 | l.231+ | settingsMetrics.card* |
| row pad | l.238+ | rowPad* / iconSize |

## Écarts connus
1. **Photo change** : hors périmètre (JPEG/sélection).
2. **Commandes / Menu / Droits / aperçu** : L4c.
3. **hasPhoto** : tentative Image + onError → initiale (GET photo binaire).
4. **Sonde langues** : séquentielle (pas de parallélisme 5).
5. **Notifications** : toujours étape 8.
