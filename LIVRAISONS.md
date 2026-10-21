# LIVRAISONS — L4a Gestion (bots, appareils, préférences)

## Correctif CI L4a
- Tests : `beforeEach` remet `cacheDelete`/`cacheGetString`/`cacheSetString` en `mockResolvedValue` **avant** `clear()` (comme step3).
- Lint : `TIMEZONES` retiré de PrefsSection (cycle fuseau dans GestionScreen via `TIMEZONES` de format.ts — sélecteur « Automatique » + liste, pas oublié).
- Styles en ligne → StyleSheet + métriques (DevicesSection, PrefsSection, GestionScreen, CountryPicker, EditProfileSheet).


## Navigation
Route **MemberStack `Gestion`**, entrée depuis l’onglet **Paramètres** (ligne « Gestion »). Pas de nouvel onglet BottomNav.

## Périmètre livré
- Mes bots : compteur N bots (sans /limite en dur), badges, actions retry/resync/disconnect/delete, confirmations, busy, toasts, codes 429/409/email
- Appareils : GET/DELETE sessions, logout-all → applySignedOut
- Préférences : thème (appearance), langue (FR seul), fuseau (auto + liste)
- Dette L3c : CountryPicker, tokens héros, emptyPad, tableaux feuille/dialog ci-dessous

## Fichiers créés
- `src/core/api/endpoints/sessions.ts`
- `src/features/bots/utils/webhook.ts`
- `src/features/gestion/**` (écran, store, composants, texts, utils)
- `src/shared/theme/gestionMetrics.ts`
- `src/features/member/components/CountryPicker.tsx`
- `__tests__/gestion.test.ts`

## Fichiers modifiés
- `src/app/RootNavigator.tsx` — écran Gestion
- `src/features/bots/index.ts` — export webhook utils
- `src/features/settings/screens/MemberSettingsScreen.tsx` — lien Gestion
- `src/features/settings/texts.ts`
- `src/features/member/components/EditProfileSheet.tsx` — sélecteur pays
- `src/shared/theme/index.ts`, `settingsMetrics.ts`
- `LIVRAISONS.md`

## Fichiers à supprimer
aucun

## Tableaux site → app (GestionPage.css)

| propriété | site | app |
|---|---|---|
| scroll pad/gap | padding 14 14 32 gap 22 | gestionMetrics.scroll* / sectionGap |
| head title 22/700 | .g-head__title | headTitleSize |
| bot icon 48 r16 | .g-bot__icon | botIcon / botIconRadius |
| pulse | .g-bot__pulse | pulseSize + Animated |
| card r20 | .g-card | cardRadius |
| toast 3,2 s | setTimeout 3200 | toastDurationMs |
| dialog | confirm overlay | ConfirmDialog + dialog* |

### L3c feuille modification / dialog / settings
| propriété | site | app |
|---|---|---|
| sheet r24 | MemberProfilePage.css .mp-sheet | memberProfileMetrics.sheetRadius |
| input h48 r14 | .mp-field__input | fieldInput* |
| dialog r22 max360 | .mp-dialog | dialogRadius / dialogMaxWidth |
| settings card r18 m12 | settings-list.css | settingsMetrics.card* |
| country selector | select site | CountryPicker (liste COUNTRY_CODES) |

## Écarts connus
1. **Notifications** : section absente (étape 8).
2. **Langue** : sélecteur affiché, seule valeur FR active.
3. **Limite bots** : affichage « N bots » sans /max (limite Worker, pas de constante app).
4. **Profil Telegram bot** : L4b/L4c.
5. **Captures** : non fournies ici.

## Tests
`__tests__/gestion.test.ts` : webhookOf, actions, dates, sessions, 429.
