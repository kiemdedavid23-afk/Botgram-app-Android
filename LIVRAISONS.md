# Livraisons — Stabilisation

## Fichiers modifiés (stabilisation uniquement)

| Fichier | Avant → Après | Pourquoi |
|---|---|---|
| appearance.ts | 2 → 58 lignes | Restauration complète (version étape 2 v2) |
| session.ts | +1 ligne | Remise de l'import http |
| RootNavigator.tsx | −1 / +2 | Suppression Stack, ajout UpgradeScreen + authColors |
| App.tsx | −1 | Suppression backgroundColor sur StatusBar |
| authColors.ts | +1 | Ajout fabShadow |
| botsStore.ts | 2 lignes | cacheRemove → cacheDelete, await cacheGetString |
| quotaStore.ts | 2 lignes | idem |
| DashboardScreen.tsx | +1 | import authColors |
| ProfileScreen.tsx | 1 ligne | type usage union |
| session-c1.test.ts | −2 / +1 | import statique, suppression mockSave inutilisé |
| session.test.ts | −2 / +1 | import statique |
| AssociateTokenScreen.tsx | 1 ligne | setHidden inutilisé retiré |
| authStore.ts | 1 ligne | paramètre get retiré |
| .eslintrc.js | +6 | override jest pour tests |

## Commandes
npm run typecheck : en attente (typescript en cours d'installation)
npm run lint : non exécuté
npm test : non exécuté

## Correctif minimal (3 erreurs)
1. quotaStore.ts:6 : import cacheDelete (relu, confirmé).
2. session.ts:134 : condition !first.ok && first.status === 426 (relu, confirmé).
3. http.test.ts:66 : enveloppe UPGRADE_REQUIRED complète avec details.latest (choix : adapter le test à l'enveloppe réelle, relu).
