# Livraisons — Botgram App

## Étape 1 — Socle (2026-10-19)

### Contenu livré

- Projet React Native **nu** 0.88.0 (CLI, pas d’Expo), TypeScript strict, Hermes
- Arborescence conforme §3 du contrat
- `core/config/env.ts` (seul lecteur de config de build)
- `core/api/http.ts` (seul `fetch`, `credentials:'omit'`, en-têtes X-App-*)
- `core/storage` : Keychain (tokens + clé MMKV) + MMKV chiffré
- `core/realtime` : interface `RealtimeTransport` + transport no-op (pas de WebSocket)
- `shared/theme` : tokens exacts 02-DESIGN-TOKENS, gradients, ThemeProvider, useTheme, clair/sombre, suivre système, réglages d’apparence
- Navigation racine : **deux** pilules flottantes (BottomNav membre + BotBottomNav bot), BrandBar 56 px, écrans vides
- CI GitHub `ci.yml` (typecheck, lint, test)
- Android : `allowBackup=false`, `usesCleartextTraffic=false`
- Docs Worker copiées dans `docs/worker-contract/`
- Tests Jest : tokens couleurs/dimensions, export http

### Versions épinglées (extrait)

| Package | Version | Motif |
|---|---|---|
| react-native | 0.88.0 | Dernière stable officielle au 19/10/2026 (React 19.3, Metro 0.87, pas de breaking user-facing) |
| react | 19.3.0 | Aligné sur RN 0.88 |
| react-native-mmkv | 3.3.3 | 4.x exige `react-native-nitro-modules` **hors liste fermée** → 3.3.3 retenu |
| typescript | 5.9.3 | Stable, compatible RN 0.88 (évite TS 7 encore trop récent pour l’écosystème RN) |
| @react-navigation/* | 7.5.1 / 7.21.0 | Stables courantes |
| zustand | 5.0.15 | |
| react-native-keychain | 10.0.0 | |
| lucide-react-native | 1.59.0 | |

Toutes les dépendances de production sont dans la **liste fermée** du contrat. Aucune autre ajoutée.

### Correspondance ombres CSS → Android

| Token | CSS (clair) | elevation | shadowOpacity | shadowRadius | offset |
|---|---|---|---|---|---|
| sm | 0 1px 2px rgba(0,0,0,.06) | 1 | 0.06 | 2 | 0,1 |
| md | 0 2px 8px rgba(0,0,0,.10) | 3 | 0.10 | 8 | 0,2 |
| navPill | 0 2px 16px rgba(0,0,0,.10) + liseré 1px rgba(0,0,0,.04) | 4 | 0.10 | 16 | 0,2 |
| menu | 0 10px 30px rgba(0,0,0,.18) | 8 | 0.18 | 30 | 0,10 |

Sombre : opacités 0.35 / 0.45 / 0.40 pour sm / md / navPill.  
**Liseré pilule** : `borderWidth: 1` + `navPillBorder.light|dark` (rgba exactes du site).

### Repli flou (V-G)

Pas de module de flou. Fond de pilule = `colors.navBg` (`rgba(255,255,255,0.92)` / `rgba(33,33,33,0.92)`). Documenté ici.

### Tableau de conformité design → code

| Token / élément | Fichier:référence |
|---|---|
| bgPrimary clair/sombre | `src/shared/theme/tokens.ts` lightColors/darkColors |
| accent, accentSoft, navBg | idem |
| bubbleIn/Out | idem |
| radii.navPill 28, navItemActive 22 | `tokens.ts` → `radii` |
| space.bottomNavZone 72, pill 58 | `tokens.ts` → `space` |
| brandBarHeight 56 | `tokens.ts` + `BrandBar.tsx` |
| Icônes size 22 strokeWidth 1.8 | `BottomNav.tsx`, `BotBottomNav.tsx` |
| Avatar nav 24 + dégradé couleurs | `BotBottomNav.tsx` (approx solid `#3390ec`, couleurs dans `gradients.ts`) |
| Liseré pilule | `navPillBorder` + `borderWidth:1` dans les deux BottomNav |
| Ombres | `tokens.ts` → `shadows` + `getShadow()` |
| Thème clair/sombre + followSystem | `ThemeProvider.tsx` |
| Apparence défaut fontSize 16, cornerRadius 17 | `defaultAppearance` |
| Fonds d’écran 5 + nameColors 5 | `tokens.ts` / `gradients.ts` |
| Empty screens | `EmptyScreen.tsx` + `RootNavigator.tsx` |

### Écarts / limites connues

1. **Captures d’écran** : non fournies — aucun émulateur Android ni SDK complet dans l’environnement de build agent. Le propriétaire lancera l’app et fournira les captures clair/sombre.
2. **Lockfile** : généré si `npm install` réussit dans cet environnement ; sinon à régénérer localement (`npm install` avec registry npmjs).
3. **Avatar dégradé** : `react-native-linear-gradient` n’est **pas** dans la liste fermée. Approximation : fond uni `#3390ec` (première couleur du dégradé). Signalé ; décision propriétaire si ajout autorisé plus tard.
4. **Squelette Android** : fichiers Gradle / Kotlin minimaux pour RN 0.88 ; un `npx @react-native-community/cli init` local ou l’Upgrade Helper peut compléter les assets mipmap / gradle wrapper si besoin.
5. **Pas d’auth, pas de polling, pas d’endpoints métier** (hors étape 1).
6. **Sélecteur Espace membre / Espace bot** : temporaire pour démontrer les deux pilules ; à retirer dès qu’une session réelle existe.

### Commandes qualité

Environnement agent : Node 24 disponible, **pas de SDK Android**, registry npm parfois en 502 via proxy interne.

```
# Exécutées si install possible :
npm run typecheck
npm run lint
npm test
```

Si les sorties ne figurent pas ci-dessous, c’est que `npm install` n’a pas pu aboutir dans l’environnement agent (réseau/proxy). **Ne pas considérer tsc/eslint/jest comme verts sans sortie collée.**

### Fichiers principaux créés

- `package.json`, `tsconfig.json`, `babel.config.js`, `metro.config.js`, `index.js`, `app.json`, `.env.example`
- `src/core/config/env.ts`, `src/core/api/http.ts`
- `src/core/storage/{secureStorage,cache,index}.ts`
- `src/core/realtime/{RealtimeTransport,index}.ts`
- `src/shared/theme/{tokens,gradients,ThemeProvider,index}.ts(x)`
- `src/shared/components/{BrandBar,BottomNav,BotBottomNav,EmptyScreen,index}.tsx`
- `src/app/{App,RootNavigator}.tsx`
- `src/features/*/index.ts`
- `.github/workflows/ci.yml`
- `android/` (manifest sécurisé, MainActivity/Application Kotlin, gradle)
- `__tests__/{theme,http}.test.ts`
- `README.md`, `ARCHITECTURE.md`, `LIVRAISONS.md`, `docs/worker-contract/*`


### Sorties de commandes (environnement agent)

```
npm install : ÉCHEC / incomplet (proxy registry interne 502 intermittent, pas de package-lock.json généré ici)
tsc --noEmit : NON EXÉCUTÉ (dépendances non installées)
eslint : NON EXÉCUTÉ
jest : NON EXÉCUTÉ
```

Le propriétaire doit lancer localement :

```bash
cd botgram-app
npm install
npm run typecheck
npm run lint
npm test
```

et coller les sorties pour clôture de l'étape 1.

## Étape 1 — correctif (2026-10-19)

### Corrections appliquées

**BLOQUANT**
- `package-lock.json` fourni (généré avec `npm install --package-lock-only`).
- Affirmation « dernière stable » retirée des justifications de versions.
- `secureStorage.ts` : génération de clé MMKV via `Math.random` supprimée. La fonction lève une erreur explicite.  
  **Options proposées au propriétaire** (aucune dépendance ajoutée) :
  1. Autoriser `react-native-get-random-values` (hors liste) + `crypto.getRandomValues` — coût : +1 dépendance native, polyfill standard RN.
  2. Injecter la clé via secret CI / `.env` au premier build — coût : processus de déploiement à définir, pas de génération côté app.

**MAJEUR**
- ESLint épinglé à **8.57.1** (compatible `.eslintrc.js` + `--ext`).
- Avatar bot : dégradé via `react-native-svg` `LinearGradient` dans le composant réutilisable `shared/components/GradientView.tsx`.
- Libellé actif de la pilule : plus de `fontWeight` semibold (couleur + fond uniquement).
- Zone pilule : hauteur = `72 + insets.bottom`, marge sous la pilule conservée à 10 px.
- `http.ts` : `fetch` ne lève plus ; erreurs réseau/timeout/abort → `{ok:false, error:{code:'network_error'|'timeout'|'aborted'}, status:0}` ; timeout 30 s par défaut ; en-tête `Origin` ignoré ; 202/204 → succès `data=null`.
- `android/` : squelette manuel supprimé. Liste exacte des modifications à appliquer après génération RN CLI dans `ARCHITECTURE.md`.
- `RootNavigator.tsx` : code mort retiré, `ShellSwitcher` isolé dans `src/app/dev/ShellSwitcher.tsx` (temporaire).

**MINEUR**
- `tokens.ts` découpé en `colors.ts` / `metrics.ts` / `shadows.ts` / `appearance.ts` ; export unique via `index.ts`.
- Alias `@/` retiré de `tsconfig.json` et `jest.config.js` (non supporté côté Babel).
- `@types/jest` aligné sur `29.5.14` avec `jest@29.7.0`.
- Duplication fonds d’écran : source unique dans `appearance.ts` + `gradients.ts`.
- Test `http` remplacé par tests mockés (en-têtes, Origin, network_error, JSON invalide, 426).

### Commandes

```
npm run typecheck : non exécuté (dépendances natives non installées dans l'environnement agent)
npm run lint : non exécuté
npm test : non exécuté
```

Le propriétaire exécutera ces commandes après `npm install` local.
