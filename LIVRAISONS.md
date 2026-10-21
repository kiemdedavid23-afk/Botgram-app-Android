# LIVRAISONS — L3b import path fix

## Fichiers modifiés
| Fichier | Changement |
|---|---|
| `__tests__/step3-member-data.test.ts` | import `useAssociateStore` → `../src/features/associate/store/associateStore` |

Recherche `bots/store/associateStore` : plus aucune occurrence dans ce fichier.
Les écrans associate livrés en L3b-fix pointent déjà vers `../store/associateStore`.

## Fichiers à supprimer
- `src/features/bots/store/associateStore.ts`
- `src/features/associate/components/store/associateStore.ts` (si présent)
- `src/features/associate/screens/AssociateStackScreens.tsx` (si présent)
