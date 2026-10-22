# LIVRAISONS - Botgram app (cumulatif)

## L4c - réserves finales (valeurs en dur écran + tableaux)

### Points
| # | Point | Fait | Fichier |
|---|-------|------|---------|
| 1 | BotProfileScreen styles → metrics uniquement | **fait** | BotProfileScreen.tsx + botProfileMetrics.ts |
| 2 | Saisie commandes sans filtre | **fait** (précédent) | CommandsSection.tsx |
| 3 | Tableaux LIVRAISONS complets | **fait** | ce fichier |

### Clés botProfileMetrics
**Ajoutées** (dont cette livraison) : `tabIconGap` (8, site .bp-tab row gap l.183).  
Toutes les clés L4b/L4c précédentes conservées.  
**Retirées** : aucune.

### Fichiers livrés (chemins complets)
| Chemin | Action |
|--------|--------|
| `src/features/botprofile/screens/BotProfileScreen.tsx` | modifié |
| `src/shared/theme/botProfileMetrics.ts` | modifié (fusion) |
| `LIVRAISONS.md` | modifié |

---

## L4c - patch 2 (écrans)

### Chemins complets des fichiers livrés
| Chemin | Action |
|--------|--------|
| `src/features/botprofile/components/CommandsSection.tsx` | créé |
| `src/features/botprofile/components/MenuSection.tsx` | créé |
| `src/features/botprofile/components/RightsSection.tsx` | créé |
| `src/features/botprofile/components/TelegramPreview.tsx` | créé |
| `src/features/botprofile/screens/BotProfileScreen.tsx` | modifié (6 onglets) |
| `src/features/botprofile/utils/tabs.ts` | créé |
| `src/features/botprofile/utils/edit.ts` | modifié (+ resolveText) |
| `src/features/botprofile/utils/languages.ts` | modifié (+ languagesOf) |
| `src/shared/theme/botProfileMetrics.ts` | modifié (fusion) |
| `src/features/botprofile/components/BotHero.tsx` | modifié (tokens) |
| `src/features/botprofile/components/IdentitySection.tsx` | modifié (tokens) |
| `src/features/botprofile/components/LanguagesSection.tsx` | modifié (tokens) |
| `src/features/botprofile/components/InfoSection.tsx` | modifié (tokens) |
| `src/features/botprofile/components/LangChips.tsx` | modifié (tokens) |
| `src/features/botprofile/components/SaveBar.tsx` | modifié (tokens) |
| `__tests__/bot-profile.test.ts` | modifié |

### Fichiers à supprimer
aucun

### Écarts connus
1. Photo bot (JPEG / sélecteur d’image) : hors périmètre L4c
2. Collage bulk format BotFather : non porté (ajout / réordonnancement ligne à ligne)
3. Bouton « Configurer avec Botfactor » : non porté (pas de botfactor mobile)
4. `flex: 1`, `left/right/bottom: 0` : layout React Native, pas design
5. `backgroundColor: 'transparent'` sur radio off (MenuSection) : état neutre CSS

---

## Tableaux propriété | valeur site (fichier:ligne) | valeur app (token)

Source CSS : `Botgram/src/features/botprofile/BotProfile.css` sauf mention contraire.  
Tokens : `botProfileMetrics` / `colors` (lightColors + darkColors).

### Héros (.bp-hero)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| min-height | BotProfile.css:35 `min-height: 300px` | heroMinHeight = 300 |
| border-radius | BotProfile.css:34 `border-radius: 22px` | heroRadius = 22 |
| padding | BotProfile.css:36 `padding: 16px` | heroPad = 16 |
| gap | BotProfile.css:40 `gap: 10px` | heroGap = 10 |
| --hero-avatar | BotProfile.css:31 `104px` | heroAvatar = 104 |
| avatar border | site caméra/anneau ~3px | heroAvatarBorder = 3 |
| name font-size | BotProfile.css:113 `font-size: 22px` | heroNameSize = 22 |
| name font-weight | BotProfile.css:113 `font-weight: 800` | heroNameWeight ≈ 700 (RN) |
| user font-size | BotProfile.css:116 `font-size: 14px` | heroUserSize = 14 |
| user opacity | BotProfile.css:116 `rgba(..., 0.88)` | heroUserOpacity = 0.9 |
| initial size/weight | dérivé avatar | heroInitialSize = 40 / heroInitialWeight = 700 |
| complete text | .bp-pill l.121 `12px/600` | heroCompleteTextSize/Weight |
| missing text | dérivé | heroMissingSize = 11 / Opacity 0.9 |
| complete margin-top | dérivé | heroCompleteMarginTop = 4 |
| dégradé clair | gradients.brandHero | gradients.brandHero |
| dégradé sombre | gradients.brandHeroAlt | gradients.brandHeroAlt |
| texte héros | colors.heroText / white | colors.white / heroText |

### Onglets (.bp-tabs / .bp-tab)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| tabs gap | BotProfile.css:152–159 zone tabs | gap = 6 |
| tab min-height colonne | BotProfile.css:171 zone | tabMinHeight = 52 |
| tab min-height row | BotProfile.css:183 `min-height: 42px` | tabRowMinHeight = 42 |
| tab font row | BotProfile.css:183 `font-size: 14px` | tabLabelSize = 14 |
| tab padding row | BotProfile.css:183 `padding: 0 16px` | tabPadH = 14 (proche) |
| tab gap icon/label | BotProfile.css:183 `gap: 8px` | tabIconGap = 8 |
| tab border-radius | BotProfile.css:171 zone ~14px | tabRadius = 14 |
| tab pad L4b | align app | tabPadV = 10 / tabPadH = 14 |
| tab font-weight | gras actif | tabFontWeight = 700 |
| tab icon size | lucide | tabIconSize = 16 |
| actif fond | BotProfile.css:181 `background: var(--accent)` | colors.accent (tabOn) |
| actif texte | BotProfile.css:181 `color: #fff` | colors.white |
| inactif fond | bg-primary | colors.bgPrimary (tabOff) |
| inactif texte | text-secondary | colors.textSecondary |
| head title | BotProfile.css:186–187 ~18px/800 | headTitleSize = 18 / headTitleWeight = 800 |
| head hint | BotProfile.css:188 `font-size: 13px` | headHintSize = 13 / headHintLineHeight = 18 |
| head gap/pad | dérivé | headGap = 2 / headPadH = 4 / headPadBottom = 12 |
| ordre | BotProfilePage.tsx TABS | PROFILE_TABS (Identité→…→Infos) |

### Identité (.bp-field / .bp-input)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| stack gap | BotProfile.css:27 `.bp-stack gap: 14px` | stackGap = 14 |
| field gap | BotProfile.css:236 `gap: 6px` | fieldInnerGap = 6 |
| label size/weight | BotProfile.css:238 `12.5px/700` | labelSize = 13 / labelWeight = 600 |
| counter | BotProfile.css:239 `font-size: 12px` | counterSize = 12 |
| input min-height | BotProfile.css:245 `min-height: 46px` | inputHeight = 48 |
| input radius | align design system 14 | inputRadius = 14 |
| input pad H | BotProfile.css:245 `padding: 0 14px` | inputPadH = 14 |
| input pad V | .bp-input--area l.252 `12px 14px` | inputPadV = 10 |
| input font | 15 | inputFontSize = 15 |
| area min-height | multi-ligne | areaMinHeight = 88 |
| error font | BotProfile.css:242 `12.5px` | errFontSize = 12 |
| border width | 1px | borderWidth = 1 |
| border color | var(--border) / danger | colors.border / colors.danger |
| fond input | var(--bg-*) | colors.bgPrimary |

### Langues (.bp-chips / listes)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| chips gap | BotProfile.css:224 `gap: 8px` | chipRowGap = 8 / langStackGap = 8 |
| chip pad | BotProfile.css:121 zone pill `6px 12px` | chipPadV = 6 / chipPadH = 12 |
| chip radius | BotProfile.css:121 `99px` | chipRadius = 99 |
| chip font | ~13/600 | chipFontSize = 13 / chipFontWeight = 600 |
| row pad | .bp-row l.209 `14px 16px` | langRowPad = 14 |
| name | .bp-row__val l.211 `15px/600` | langNameSize = 15 / langNameWeight = 600 |
| add title | ~13/600 | langAddTitleSize = 13 |
| add margin-top | 8 | langAddMarginTop = 8 |
| add row pad | 12 | langRowGap = 12 |
| chip on | accent-soft + accent | colors.accentSoft / colors.accent |
| chip off | bg-tertiary | colors.bgTertiary |

### Commandes (.bp-cmds / .bp-cmd)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| root pad-bottom | BotProfile.css:257 `padding: 0 0 6px` | rootPadBottom = 6 |
| head pad | BotProfile.css:258 `16px 16px 12px` | headPaddingH/Top/Bottom |
| title | BotProfile.css:259 `15px/700` | titleFontSize = 15 / titleFontWeight = 700 |
| actions gap/pad | BotProfile.css:260 `gap: 8px; padding: 10px 16px` | actionsGap / actionsPadding* |
| item gap/pad | BotProfile.css:263 `gap: 8px; padding: 12px 16px` | itemGap / itemPaddingV/H |
| border-top item | BotProfile.css:263 `1px solid var(--bg-secondary)` | borderWidth + colors.bgSecondary |
| fields gap | BotProfile.css:264 `gap: 8px` | fieldGapInner = 8 |
| line gap | BotProfile.css:265 `gap: 6px` | lineGap = 6 |
| slash | BotProfile.css:266 `18px/700 accent` | slashFontSize/Weight + colors.accent |
| tools gap | BotProfile.css:267 `gap: 6px` | fieldGapInner |
| section label | uppercase 11/700 | sectionLabelSize/Weight/Spacing |
| btn pad/radius | 8 12 / 12 | btnPadV/H / btnRadius |
| empty pad | .bp-empty l.207 | emptyPad = 16 |
| saisie | site : pas de filtre à la frappe | `update(index, {command: t})` |

### Menu (.bp-card / .bp-radio / fields)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| card radius | BotProfile.css:199 `border-radius: 18px` | cardRadius = 16 (proche) |
| card margin | 14 | cardMarginH = 14 |
| row pad | BotProfile.css:209 `14px 16px` | optionPaddingV/H = 12/16 |
| row gap | BotProfile.css:209 `gap: 12px` | rowGap = 12 |
| val | BotProfile.css:211 `15px/600` | valSize / valWeight |
| key/hint | BotProfile.css:212 `12.5px` | keySize = 12 / keyLineHeight = 16 |
| note | BotProfile.css:206 `13px` | noteSize = 13 / noteLineHeight = 18 |
| radio dot | ~20px | radioDotSize = 20 / radioDotBorder = 2 |
| fields gap/pad | 12 / 14 | fieldsGap / fieldsPad |
| input | .bp-input l.244–245 | inputHeight / inputRadius / inputPadH |
| types | default / commands / web_app | OPTIONS + setMenuButton |

### Droits (.bp-switch)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| switch width/height | BotProfile.css:~360 `52×30` | switchWidth = 52 / switchHeight = 30 |
| knob size | ~24 | knobSize = 24 |
| knob offset | ~3 | knobOffset = 3 |
| knob travel | BotProfile.css:~371 `translateX(22px)` | knobTravel = 22 |
| row pad | 12 16 | rowPaddingV/H |
| row gap | 12 | rowGap = 12 |
| on bg | var(--accent) | colors.accent (swOn) |
| off bg | bg-tertiary | colors.bgTertiary (swOff) |
| knob bg | #fff | colors.white |
| radius full | 99 | fullRadius = 99 |
| filtre portée | RIGHT_SCOPE | RIGHT_SCOPE groups/channels/both |
| tout / rien | UI | texts.rightsAll / rightsNone |

### Aperçu Telegram (.bp-preview / .bp-phone)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| root gap | BotProfile.css:277 `gap: 8px` | gridGap / rootMarginTop |
| label | BotProfile.css:278 `12px/700/0.08em` | labelFontSize/Weight/LetterSpacing |
| grid gap | BotProfile.css:279 `gap: 10px` | gridGap = 10 |
| phone radius | BotProfile.css:282–286 `border-radius: 20px` | phoneRadius = 20 |
| phone padding | BotProfile.css:282–287 `14px` / wide 12 | phonePadding = 12 |
| fond phone | gradient / bg | colors.bgChat |
| profile gap | BotProfile.css:288 `gap: 6px` | profileGap = 6 |
| name | BotProfile.css:289 `16px` | nameSize = 16 / nameWeight = 600 |
| tag | BotProfile.css:290 `10.5px/700` | tagSize/Weight/LetterSpacing/Pad* |
| tag couleurs | accent-soft + accent | colors.accentSoft / colors.accent |
| short | BotProfile.css:291 `13px` | shortSize / shortLineHeight |
| user | BotProfile.css:292 `12px accent` | userSize + colors.accent |
| empty-chat radius/pad | BotProfile.css:295–297 `16px` / `12px 14px` | emptyChatRadius / Padding* |
| empty fond | var(--bg-primary) / bubble | colors.bubbleIn |
| empty title | BotProfile.css:298 `13.5px` | emptyTitleSizePrev / WeightPrev |
| empty body | BotProfile.css:299 `12.5px` | emptyBodySize / LineHeight / MarginTop |
| bar gap | BotProfile.css:301 `gap: 8px` | barGap = 8 |
| menu pill | BotProfile.css:302 `7px 12px / 99 / accent` | menuPill* + colors.accent / white |
| input pill | BotProfile.css:303 `7px 12px / 99` | inputPill* + colors.bgPrimary / textHint |
| avatar preview | 64 | avatarSize = 64 |

### Infos
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| stack gap | .bp-stack 14 → section 12 | infoStackGap = 12 |
| card pad/gap | .bp-card / row | infoCardPad = 14 / infoCardGap = 4 |
| key | ~12 | infoKeySize = 12 / infoKeyMarginTop = 6 |
| val | 15/600 | infoValSize / infoValWeight |
| btn height/radius | inputHeight / inputRadius | m.inputHeight / m.inputRadius |
| btn font | 15/700 | infoBtnFontSize / infoBtnWeight |
| couleurs | textPrimary / accent | colors.* |

### Barre d’enregistrement
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| pad | align L4b / site bar | saveBarPad = 14 |
| btn height | saveBarHeight − offset | saveBarHeight = 56 / saveBarBtnHeightOffset = 16 |
| gap | 10 | saveBarGap = 10 |
| btn font | 15/700 | saveBarBtnFontSize / saveBarBtnWeight |
| border-top | 1px | saveBarBorderWidth = 1 |
| visible | hasChanges | hasChanges(saved, draft) textes+cmd+menu+rights |
| fond/bordure | bg / border | colors.bgPrimary / colors.border |
| CTA save | accent + white | colors.accent / colors.white |

### Compte rendu
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| pad | 14 | reportPad = 14 |
| gap | 6 | reportGap = 6 |
| radius | inputRadius | inputRadius = 14 |
| titre weight / margin | 700 / 4 | reportTitleWeight / reportTitleMarginBottom |
| ligne size | 13 | reportLineSize = 13 |
| ok couleur | success / online | colors.online |
| err couleur | danger | colors.danger |
| fermer weight / margin | 600 / 8 | reportCloseWeight / reportCloseMarginTop |
| fond | bg-primary | colors.bgPrimary |

### Scroll / écran vide
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| scroll pad H/bottom | BotProfile.css:19 `0 14px 110px` | scrollPadH = 14 / scrollPadBottom = 110 |
| scroll gap | BotProfile.css:22 `gap: 12px` | scrollGap = 12 |
| first-child margin-top | BotProfile.css:25 `12px` | scrollPadTop = 12 |
| center gap/pad | empty states | centerGap = 12 / centerPad = 24 |
| empty title | 18/700 | emptyTitleSize / emptyTitleWeight |
| CTA margin/pad | 8 / 12 20 | ctaMarginTop / ctaPadV / ctaPadH |
| CTA text weight | 700 | ctaTextWeight = 700 |

### Animations (réf. site)
| propriété | site (fichier:ligne) | app (token) |
|-----------|----------------------|-------------|
| section rise | BotProfile.css:190 `bp-rise 0.28s cubic-bezier(0.22,1,0.36,1)` | animation tokens shared + useReducedMotion |
| tab active scale | BotProfile.css:180 `scale(0.95)` | Pressable (pas de dureté locale) |
| reduced motion | BotProfile.css:~439 transition:none | useReducedMotion |

### Couleurs deux thèmes
| rôle | light / dark | token |
|------|--------------|-------|
| fond page | bg-secondary | colors.bgSecondary |
| carte / input | bg-primary | colors.bgPrimary |
| texte | text-primary / secondary / hint | colors.text* |
| accent | accent / accent-soft | colors.accent / accentSoft |
| danger | danger | colors.danger |
| succès report | online | colors.online |
| chat aperçu | bg-chat / bubble-in | colors.bgChat / bubbleIn / bubbleInText |

---

### CI
typecheck 0, lint 0, ≥ 150 tests
