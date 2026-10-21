# LIVRAISONS — L3b réserves

## Fichiers modifiés
Feature associate complète + theme + test + RootNavigator (inchangé structure).

## Fichiers à supprimer
- `src/features/bots/store/associateStore.ts`
- `src/features/associate/components/store/associateStore.ts` (si présent)
- `src/features/associate/screens/AssociateStackScreens.tsx` (si présent)

## Tableaux site → app

### Shell (AssociateFlow.css)
| propriété | site | app |
|---|---|---|
| head gap / pad | l.12-13 gap 8, pad 12 16 | headGap, headPadV/H |
| title | l.22-23 18/600 | headTitleSize/Weight |
| progress | l.29-37 gap 6 h 4 r 2 | progress* |
| body | l.52-55 20 16 32 gap 16 | bodyPad*, bodyGap |

### Intro
| propriété | site | app |
|---|---|---|
| card | l.62-63 r-lg pad 20 | cardRadius, cardPad |
| points gap | l.85 gap 10 | pointGap |
| check | l.130-142 gap 12 pad 14 box 18 | check* |
| ok color | .assoc__ok #1b7f3a / #f0fff4 | success / successSoft |
| btn disabled opacity | l.186 0.7 | btnDisabledOpacity |

### Ready
| propriété | site | app |
|---|---|---|
| card + continue | mêmes tokens card / btn | card*, btn* |

### Token
| propriété | site | app |
|---|---|---|
| input | l.148-153 border, pad 14 16, font 16 | input* |
| jeton = store | mémoire only | value={token} store, pas de useState local |
| ghost | l.199 border accent | ghost* |

### Verify
| propriété | site | app |
|---|---|---|
| preview avatar | l.219-233 52 / 20 | avatar, avatarFont |
| error bg | l.108 #fff4f4 | dangerSoft |

### Confirm
| propriété | site | app |
|---|---|---|
| sans bot → token | AssociateConfirmPage useEffect | onNeedToken → replace AssociateToken |
| no_token | confirm() | onNeedToken |

### Done
| propriété | site | app |
|---|---|---|
| icône check | done | doneIcon 48 |
| reset sortie | — | reset() on unmount / home |

## Corrections vérifiées dans le code
1. Token : pas de useState local ; value={token} store
2. Confirm : useEffect !token\|\|!preview → onNeedToken ; no_token → onNeedToken
3. Abandon : useResetOnLeaveFlow + reset on Intro back + test abandon
4. Metrics : toutes tailles dans associateMetrics
5. Pas de btnEnabled vide
6. dangerSoft token (pas de concat)
7. onVerified: VerifyResult
8. Pas de commentaires Emplacement/Imports
