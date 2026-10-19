# Botgram — Application Android (React Native)

Version mobile de Botgram. Messagerie **depuis les bots Telegram** du membre (pas membre-à-membre).

## Stack (étape 1)

- React Native **0.88.0** (CLI, pas d’Expo), Hermes, Android uniquement
- TypeScript strict (`strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`)
- Zustand, React Navigation, StyleSheet + thème fidèle au site
- Dépendances **épinglées** (voir `package.json`)

## Démarrage

```bash
cp .env.example .env
# Éditer .env si besoin (API_URL reste le placeholder en local)
npm install
npm start
# Autre terminal :
npm run android
```

L’URL réelle du Worker est injectée **à la compilation** via le secret GitHub `API_URL` (workflow release, étape 9). Ne jamais la committer.

## Scripts

| Commande | Rôle |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint |
| `npm test` | Jest |
| `npm run android` | Build + run debug |

## Architecture

Voir [ARCHITECTURE.md](./ARCHITECTURE.md) et le contrat `01-CONTRAT-GROK.md`.

## Livraisons

Voir [LIVRAISONS.md](./LIVRAISONS.md).
