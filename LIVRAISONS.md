# LIVRAISONS — L3b fix arborescence

## Arborescence finale `src/features/associate`

```
src/features/associate/
├── index.ts                          → ./store/associateStore, ./texts
├── texts.ts
├── AssociateStackScreens.tsx         → ./screens/*, ./store/associateStore
├── store/
│   └── associateStore.ts             → ../../../core/api/endpoints/bots
│                                       ../../../core/utils/memberData
├── components/
│   └── AssociateShell.tsx            → ../../../shared/theme, ../texts
└── screens/
    ├── AssociateIntroScreen.tsx      → ../components, ../store, ../texts
    ├── AssociateReadyScreen.tsx
    ├── AssociateTokenScreen.tsx
    ├── AssociateVerifyScreen.tsx
    ├── AssociateConfirmScreen.tsx    → + ../../bots/store, ../../member/store
    └── AssociateDoneScreen.tsx
```

RootNavigator : `../features/associate/AssociateStackScreens`
Test : `../src/features/associate/store/associateStore`

## Fichiers à supprimer
- `src/features/bots/store/associateStore.ts` (ancien emplacement)
- `src/features/associate/components/store/associateStore.ts` (si créé par erreur)
- `src/features/associate/screens/AssociateStackScreens.tsx` (si créé par erreur dans screens/)

## Corrections
1. Store uniquement dans `store/associateStore.ts` (imports core ../../../)
2. AssociateStackScreens à la racine associate/ (pas dans screens/)
3. AppState garde l’effacement du jeton en arrière-plan (implémenté + test clearToken)
4. globalThis dans le test
5. opacity / fontSize 12 → StyleSheet + associateMetrics (btnDisabledOpacity, tickFont)

## Écarts
- Lien guide inerte
