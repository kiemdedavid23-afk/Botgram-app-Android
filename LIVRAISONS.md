# LIVRAISONS — L3c Profil membre + Paramètres

## Périmètre
- Écran Profil membre (onglet `member`) : héros, sections Informations / Compte / Session
- Feuille de modification (EDITABLE_FIELDS) → PATCH /me
- Suppression de compte en 2 étapes (code_length du Worker)
- Onglet Paramètres : Mon profil, Se déconnecter (pas de Documentation)
- Câblage RootNavigator ; suppression BotManageScreen

## Fichiers créés
- `src/features/member/utils/format.ts`
- `src/features/member/texts.ts`
- `src/features/member/screens/MemberProfileScreen.tsx`
- `src/features/member/components/ProfileHero.tsx`
- `src/features/member/components/ProfileRow.tsx`
- `src/features/member/components/ProfileSections.tsx`
- `src/features/member/components/EditProfileSheet.tsx`
- `src/features/member/components/DeleteAccountDialog.tsx`
- `src/features/settings/texts.ts`
- `src/features/settings/screens/MemberSettingsScreen.tsx`
- `src/shared/theme/memberProfileMetrics.ts`
- `src/shared/theme/settingsMetrics.ts`
- `__tests__/member-profile.test.ts`

## Fichiers modifiés
- `src/features/member/store/memberStore.ts` — `deleteCodeLength`, `resetDelete`
- `src/features/member/index.ts` — exports écran + format
- `src/features/settings/index.ts` — export MemberSettingsScreen
- `src/shared/theme/colors.ts` — tokens statut / badge / settings (light + dark)
- `src/shared/theme/index.ts` — exports metrics
- `src/app/RootNavigator.tsx` — onglets Profil / Paramètres

## Fichiers à supprimer
- `src/features/bots/screens/BotManageScreen.tsx` (ébauche non ouverte ; **supprimé**)

## setMuted
Conservé dans `botsStore` (testé dans step3-member-data.test.ts). `src/features/bots/texts.ts` conservé pour l’étape 4 (bot profile).

## Tableaux site → app

### Héros (MemberProfilePage.css)
| propriété | site (fichier:ligne) | app (token) |
|---|---|---|
| radius | l.26 32 | memberProfileMetrics.heroRadius |
| min-height | l.27 430 | heroMinHeight |
| padding | l.28 44 24 38 | heroPad* |
| dégradé clair | l.33 brandHero | gradients.brandHero |
| dégradé sombre | l.36-38 brandHeroAlt | gradients.brandHeroAlt |
| orbe A/B | l.48-60 320/240 | orbA/orbB |
| name 34/800 | l.95-99 | nameSize/nameWeight |
| chip | l.115-120 | chip* + statusGood/Warn/Bad |

### Sections / lignes
| propriété | site | app |
|---|---|---|
| section title 12/700 .08em | l.145-152 | sectionTitle* |
| card radius 20 | l.172 | cardRadius |
| row pad 14 16 gap 14 | l.186-192 | rowPad*/rowGap |
| icon 38 r12 | l.200-210 | rowIcon* |
| badge 11/700 | l.248-255 | badge* |

### Feuille édition (.mp-sheet)
| propriété | site | app |
|---|---|---|
| radius haut 24 | l.295 | sheetRadius |
| input h 48 r 14 | l.340-350 | fieldInput* |
| btn h 48 r 14 15/700 | l.360-375 | btn* |
| overlay rgba(0,0,0,.45) | l.285 | colors.overlay |

### Dialog suppression
| propriété | site | app |
|---|---|---|
| max-width 360 r 22 | l.378-382 | dialogMaxWidth/dialogRadius |
| code_length | Worker response | store.deleteCodeLength (jamais 6 en dur) |

### Paramètres (settings-list.css)
| propriété | site | app |
|---|---|---|
| card margin 12 r 18 | l.231-236 | settingsMetrics.card* |
| row pad 12 14 gap 14 | l.238-248 | rowPad*/rowGap |
| icon bg profile/logout | MemberSettingsPage inline | settingsIconProfile/Logout |

## Écarts connus
1. **Photo** : pas de sélecteur d’image (hors liste dépendances) — aucun bouton caméra.
2. **Documentation** : ligne absente de l’app (guide non disponible) — signalé ici.
3. **Captures** : non fournies dans ce zip (CI / propriétaire).
4. **Sélecteur pays** : champ texte code ISO + liste d’aide (pas de Picker natif dédié).
5. **StyleSheet héros** : texte blanc sur dégradé (équivalent CSS `#fff` / `heroText`) ; orbes `rgba(255,255,255,…)` comme le site.

## Tests
- `__tests__/member-profile.test.ts` : format, updateProfile ok/validation, code_length, code invalide, resetDelete, anti double-envoi génération.
- Existant step3-member-data conserve suppression complète + clearMemberData.

## Commandes (à relancer en CI)
```
npm run typecheck
npm run lint
npm test
```
