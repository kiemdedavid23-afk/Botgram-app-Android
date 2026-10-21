# LIVRAISONS — L3c Profil membre + Paramètres (correctif CI)

## Correctif typecheck / lint (après REFUSÉE)
- `ProfileSections.tsx` : `Bot as BotIcon` (conflit type Worker `Bot`)
- `RootNavigator.tsx` : import `Pressable` inutilisé retiré
- `EditProfileSheet.tsx` : import `TextInput` inutilisé retiré (saisie via `ProfileField`)
- `void` → `fireAndForget` (DeleteAccountDialog, EditProfileSheet, MemberProfileScreen, MemberSettingsScreen)
- Token `heroAvatarInner` / `heroAvatarRing` (light+dark) — MemberProfilePage.css l.71-76
- `MemberProfileScreen` : padding état vide → `memberProfileMetrics.emptyPad` + StyleSheet
- `MemberSettingsScreen` : `settingsMetrics as sm` (no-shadow sur `s`)

## Périmètre
- Écran Profil membre (onglet `member`)
- Feuille de modification → PATCH /me
- Suppression compte 2 étapes (`code_length` Worker)
- Onglet Paramètres : Mon profil, Se déconnecter
- Câblage RootNavigator ; suppression BotManageScreen

## Fichiers créés
- `src/features/member/utils/format.ts`
- `src/features/member/texts.ts`
- `src/features/member/screens/MemberProfileScreen.tsx`
- `src/features/member/components/ProfileHero.tsx`
- `src/features/member/components/ProfileRow.tsx`
- `src/features/member/components/ProfileSections.tsx`
- `src/features/member/components/ProfileField.tsx`
- `src/features/member/components/EditProfileSheet.tsx`
- `src/features/member/components/DeleteAccountDialog.tsx`
- `src/features/settings/texts.ts`
- `src/features/settings/screens/MemberSettingsScreen.tsx`
- `src/shared/theme/memberProfileMetrics.ts`
- `src/shared/theme/settingsMetrics.ts`
- `__tests__/member-profile.test.ts`

## Fichiers modifiés
- `src/features/member/store/memberStore.ts`
- `src/features/member/index.ts`
- `src/features/settings/index.ts`
- `src/shared/theme/colors.ts`
- `src/shared/theme/index.ts`
- `src/app/RootNavigator.tsx`

## Fichiers à supprimer
- `src/features/bots/screens/BotManageScreen.tsx`

## setMuted
Conservé dans `botsStore` (testé). `src/features/bots/texts.ts` conservé pour l’étape 4.

## Tableaux site → app

### Héros (MemberProfilePage.css)
| propriété | site (fichier:ligne) | app (token) |
|---|---|---|
| radius | l.26 32 | memberProfileMetrics.heroRadius |
| min-height | l.27 430 | heroMinHeight |
| padding | l.28 44 24 38 | heroPad* |
| dégradé clair/sombre | brandHero / brandHeroAlt | gradients.* |
| orbe A/B | l.48-60 | orbA/orbB |
| anneau avatar | l.75 rgba(255,255,255,0.4) | colors.heroAvatarRing |
| fill initiale | soft white sur héros | colors.heroAvatarInner |
| chip bg/border | l.115-116 | heroChipBg / heroChipBorder |

### Feuille / dialog / settings
Inchangé vs L3c initiale (voir tokens memberProfileMetrics, settingsMetrics).

## Écarts connus
1. **Photo** : pas de sélecteur d’image — aucun bouton caméra.
2. **Documentation** : ligne absente de l’app.
3. **Captures** : non fournies ici.
4. **Sélecteur pays** : code ISO + liste d’aide.
5. **Tests** : 117 verts côté CI précédente ; typecheck/lint à revalider après ce correctif.
