# LIVRAISONS - Botgram app (cumulatif)

## L4c - patch 1 (logique) — profil bot partie 2/2

### Réserves L4b

| # | Point | Fait / non fait | Fichier | Test qui le couvre |
|---|-------|-----------------|---------|-------------------|
| 1 | getBotProfile propage erreurs commands/menu/rights | **fait** | `src/core/api/endpoints/botProfileRead.ts` | `L4c-5. lecture en erreur remonte loadError` (commands, menu, rights) |
| 2 | Suppression readHasPhoto ; hasPhoto via Image only | **fait** | `src/core/api/endpoints/botProfileRead.ts` (plus de readHasPhoto) | `L4c-6. hasPhoto initial false` |
| 3 | Split botProfile.ts (313 → read + write) | **fait** | `src/core/api/endpoints/botProfileRead.ts` + `src/core/api/endpoints/botProfile.ts` | imports + getBotProfile / setMy* |
| 4 | Tableaux LIVRAISONS exhaustifs héros/identité/… | **non fait** (reporté patch 2 UI) | — | — |

### Fichiers (chemins complets)

| Chemin | Action | Lignes |
|--------|--------|--------|
| `src/core/api/endpoints/botProfileRead.ts` | créé | 286 |
| `src/core/api/endpoints/botProfile.ts` | modifié | 137 |
| `src/features/botprofile/utils/labels.ts` | modifié | + SCOPE/RIGHT |
| `src/features/botprofile/utils/validate.ts` | modifié | + commandes + menu |
| `src/features/botprofile/utils/diff.ts` | modifié | + cmd/menu/rights |
| `src/features/botprofile/utils/edit.ts` | modifié | + parseCmdKey, setCommands… |
| `src/features/botprofile/texts.ts` | modifié | + onglets + errCmd* |
| `src/shared/theme/botProfileMetrics.ts` | modifié | + tabs/cmds/menu/rights/preview |
| `__tests__/bot-profile.test.ts` | modifié | + L4c-1..6 |

### Exports non encore utilisés par l’UI (patch 2)

- `SCOPE_LABELS`, `RIGHT_LABELS`, `RIGHT_SCOPE` → CommandsSection / RightsSection
- `setCommands`, `setMenuButton`, `setRight`, `setRights`, `parseCmdKey` → sections UI
- `botProfileTabs`, `botProfileCmds`, `botProfileMenu`, `botProfileRights`, `botProfilePreview` → composants UI
- textes `tabCommands`, `tabMenu`, `tabRights`, `cmds*`, `menu*`, `rights*`, `preview*` → écran + sections

### CI attendue

- typecheck 0, lint 0 warning
- suites démarrent ; tests L4b + L4c-1..6 verts
- ≥ 138 tests au total

### Fichiers à supprimer

aucun

---

## L4b - Profil Telegram du bot (partie 1/2)

### Navigation
Route MemberStack `BotProfile`, entree Parametres -> Profil du bot.

### Alignement site (correctifs contenu)
1. load : vide saved/draft/report si botId change AVANT fetch
2. save : met a jour seulement `saved` ; draft conserve les echecs (SaveBar reste)
3. getBotProfile : echec textes defaut -> HttpResult erreur ; sonde langues parallel 5, stop RATE_LIMITED
4. Lectures completes : texts, commands, menu, rights (groupes+canaux), hasPhoto
5. diff commit : supprime langue si gone ; removeLanguage retire commandes `|code`
6. addLanguage : copie tous les textes defaut
7. completeness : 6 criteres poids egal + missing ; hasPhoto via Image onLoad/onError
8. validate : comme site, messages dans texts.ts
9. mapProfileError : email, token, bot deconnecte, reseau, validation, serveur, 429
10. ecran : deps botId/seed stables ; edit bloque pendant saving

### Tableaux site -> app (L4b)

#### BotHero (BotProfile.css)
| propriete | site | app |
|---|---|---|
| min-height 300, radius 22 | .bp-hero | botProfileMetrics.hero* |
| avatar 104 | --hero-avatar | heroAvatar |
| degrade | brandHero / dark | gradients + GradientView |
| missing | .bp-hero__missing | texts.missingPrefix + missing[] |

#### Onglets / Identity / Langues / Infos / SaveBar
| propriete | site | app |
|---|---|---|
| 3 onglets L4b | BotProfilePage | Identity, Languages, Info |
| counters 64/512/120 | IdentitySection | FIELD_LIMITS |
| SaveBar | SaveBar.tsx | SaveBar + hasChanges |

### Fichiers a supprimer
aucun

### Ecarts connus
1. Changement de photo (JPEG/selecteur) hors perimetre
2. Commandes / Menu / Droits UI : L4c (donnees deja chargees)
3. Sonde : parallel 5 comme le site
4. hasPhoto : GET photo + Image onLoad/onError (pas d URL Worker hors core)

---

## L4a - Gestion (rappel)
Route MemberStack Gestion depuis Parametres. Bots, sessions, preferences.

---

## L3c - Profil membre / Parametres (dette tableaux)

### Feuille modification (.mp-sheet MemberProfilePage.css)
| propriete | site (fichier:ligne) | app (token) |
|---|---|---|
| radius haut 24 | .mp-sheet | memberProfileMetrics.sheetRadius |
| input h 48 r 14 | .mp-field__input | fieldInput* |
| btn h 48 r 14 | .mp-btn | btnHeight / btnRadius |
| overlay | rgba(0,0,0,.45) | colors.overlay |

### Boite suppression compte (.mp-dialog)
| propriete | site | app |
|---|---|---|
| max-width 360 r 22 | .mp-dialog | dialogMaxWidth / dialogRadius |
| code_length | Worker | store.deleteCodeLength |

### Reglages (settings-list.css)
| propriete | site | app |
|---|---|---|
| card margin 12 r 18 | settings-list | settingsMetrics.card* |
| row pad / icon | settings-list | rowPad* / iconSize |

### Ecarts L3c
- Photo membre : non
- Documentation : absente
