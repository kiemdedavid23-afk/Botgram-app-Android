# Architecture — Botgram App

## Principes (contrat §4)

| Règle | Description |
|---|---|
| R1 | Un seul `fetch(` : `src/core/api/http.ts` |
| R2 | Un fichier d’endpoints par groupe dans `core/api/endpoints/` |
| R3 | `core` n’importe jamais `features` |
| R4 | Features entre elles uniquement via leur `index.ts` |
| R5 | Écrans fins (pas de réseau/métier) |
| R6 | Seul `core/realtime` connaît `/updates` |
| R7 | Seul `core/config/env.ts` lit la config de build |
| R8 | Textes UI en français dans `texts.ts` |
| R9 | Fichiers ≤ 300 lignes, fonctions ≤ 60 |
| R10 | Pas de code mort / TODO non listé / mock livré |

## Arborescence (étape 1)

```
botgram-app/
├─ package.json  tsconfig.json  babel.config.js  metro.config.js  index.js
├─ .env.example
├─ android/          # allowBackup=false, usesCleartextTraffic=false
├─ src/
│  ├─ app/           # App, RootNavigator
│  ├─ core/
│  │  ├─ config/env.ts
│  │  ├─ api/http.ts
│  │  ├─ realtime/   # interface RealtimeTransport + noop
│  │  └─ storage/    # Keychain + MMKV chiffré
│  ├─ features/      # dossiers + index.ts (écrans vides)
│  └─ shared/
│     ├─ theme/      # tokens, gradients, ThemeProvider
│     └─ components/ # BrandBar, BottomNav, BotBottomNav, EmptyScreen
└─ docs/worker-contract/
```

## Modifications Android (à appliquer après génération officielle RN CLI)

Le dossier `android/` est généré par le propriétaire avec :

```bash
npx @react-native-community/cli init Botgram --version 0.88.0
```

Puis appliquer **uniquement** ces modifications :

1. `android/app/src/main/AndroidManifest.xml` :
   - `android:allowBackup="false"`
   - `android:usesCleartextTraffic="false"`
   - `android:name=".MainApplication"`
   - `android:theme="@style/AppTheme"`

2. `android/app/build.gradle` :
   - `namespace "com.botgram"`
   - `applicationId "com.botgram"`
   - Appliquer `react-native-config` :
     ```
     apply from: project(':react-native-config').projectDir.getPath() + "/dotenv.gradle"
     ```

3. `android/settings.gradle` : autolink standard RN 0.88.

4. Pas d'autre changement de squelette.

## Navigation (étape 1)

Deux pilules flottantes (référence site) :

1. **BottomNav** (espace membre) : Tableau de bord · Profil · Paramètres
2. **BotBottomNav** (espace bot) : Échanges · Contacts · Paramètres · Profil (avatar dégradé)

Sélecteur temporaire isolé dans `src/app/dev/ShellSwitcher.tsx` (retiré dès session réelle).

## Sécurité

- Tokens → Keychain uniquement
- Cache → MMKV chiffré, clé en Keychain
- `credentials: 'omit'`, pas d’en-tête `Origin`
- Placeholder API : `https://api.exemple.invalid/v1`
