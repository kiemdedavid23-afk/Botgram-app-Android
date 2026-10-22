# LIVRAISONS - Botgram app (cumulatif)

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
