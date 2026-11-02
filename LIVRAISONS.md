# LIVRAISONS — Botgram App (cumulatif)

## Dépendance blob-util
- `react-native-blob-util@0.25.1` exact ; fs + `android.actionViewIntent` uniquement dans `mediaFiles.ts`
- Impact android/ : FileProvider fusionné ; aucune permission storage ajoutée

## Correction session / R9 / L6b partiel
- `authedHttpBinary`, `executeFetch` unique, albums complets, auto-DL 2 Mo, clearer 13.5

## Correction CI
- MediaPhoto useCallback ; try/catch `text()`/`arrayBuffer` ; guard `(?<![.\w])fetch` ; media-album `act`

## Dette section 0 + L6c
- Guard R1 renforcé (globalThis/global/window.fetch)
- `messageTypes.ts` découpé depuis `events.ts`
- Envoi media/album, validation 10 Mo, ComposerBar trombone

## Correction audit L6c (renvoi média)
- Map mémoire `pendingByLocalId` (PickedFile + légende), vidée clear/changement de conversation
- « Renvoyer » média → `doResendMediaAsNew` (nouveau client_message_id)
- Sans fichiers en mémoire → texte `mediaResendPickAgain`, pas de bouton
- `doResendAsNew` / `doResendSameId` : no-op si `kind !== 'text'`
- Annulation : icône X + retire bulle optimiste (pas `local_network`)
- `album_types` distinct de `album_count`
- Taille 0 = inconnue (écart : pas de refus préventif taille, 413 Worker affiché)

### Écarts
- Progression indéterminée
- **Archive envoi sortant** : pas de copie disque immédiate des URI picker (évite second `fetch`/lecture hors `mediaFiles` ; l’entrant utilise toujours `GET attachment` + MediaStorage). clearMemberData continue de vider MediaStorage.

### Preuves CI
*(Coller les sorties réelles ci-dessous.)*

```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```


## Correction CI L6c (2e passe)
| Valeur | Clé | Source |
|--------|-----|--------|
| 4 | statusMarginT | MessageBubble.css status row |
| 8 | composerSendingGap | sans équivalent site |

- styles.sendingRow défini
- onRetry aligné sur `Message`
- resendMedia + clearPendingMedia branchés dans le store
- mockUuidSeq dans jest

### Checklist audit L6c
- [x] Map pending + Renvoyer média
- [x] Annulation icône X + libellé
- [x] Archive : écart déclaré
- [x] album_types
- [x] Textes i18n
- [x] LIVRAISONS cumulatif

### Preuves CI
```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```
*(Coller sorties réelles, fin incluse.)*


## L6d — Actions (livraison 1)

### Créés
- `src/features/thread/store/messageActions.ts` (`removeMessageLocally`, `doDeleteOutgoing`)
- `src/features/conversations/store/conversationActions.ts` (pin/delete/sort)
- `__tests__/message-actions.test.ts`
- `__tests__/conversation-actions.test.ts`
- `PROPOSITIONS-6BIS.md` (étude seule)

### Modifiés
- `src/core/api/endpoints/messages.ts` — `deleteMessage`
- `src/core/api/endpoints/conversations.ts` — `pinConversation`, `deleteConversation`
- stores thread + conversations, MessageBubble, ConversationRow, ConversationsBody/Screen, texts

### Écarts
- Pas d’ActionSheet natif : `Alert` multi-boutons (long press)
- Retour navigation après delete conversation : le parent doit réagir à l’absence en liste (pas de pop forcé si stack externe)

### Preuves CI
```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```
*(Coller sorties réelles.)*


## 6bis-a — Lot de preuve archive (op-sqlite + SQLCipher)

### Dépendance
| Package | Version | Notes |
|---------|---------|--------|
| `@op-engineering/op-sqlite` | **18.2.5** (exacte) | `package.json` → `"op-sqlite": { "sqlcipher": true }` |

### Créés
- `src/core/archive/ArchiveStore.ts` — interface
- `src/core/archive/opSqliteArchiveStore.ts` — seul import op-sqlite
- `src/core/archive/registerArchiveCleaner.ts` — 13.5
- `src/core/archive/index.ts`
- `__mocks__/op-sqlite.ts` (faux, déclaré)
- `__tests__/archive-store.test.ts`
- `__tests__/op-sqlite-guard.test.ts`

### Modifiés
- `package.json` — dépendance + config sqlcipher
- `src/core/storage/secureStorage.ts` — `getOrCreateArchiveKey`
- `src/core/storage/index.ts`
- `src/app/App.tsx` — bind + cleaner
- `jest.config.js` — moduleNameMapper

### Impact android/
- **Autolinking** op-sqlite ; build natif lit `package.json` → `op-sqlite.sqlcipher: true` → flags `OP_SQLITE_USE_SQLCIPHER` / SQLCipher sources dans le module.
- **Aucun fichier sous `android/` modifié manuellement** dans ce lot (pas de settings.gradle / app/build.gradle touché).
- `android:allowBackup="false"` **déjà présent** (AndroidManifest app) — vérifié.
- Le propriétaire régénère le lock et lance le workflow Android debug pour valider SQLCipher + RN 0.88 / newArch.

### Écarts / limites
- Jest utilise un **faux** ArchiveStore/op-sqlite (pas de SQLCipher en CI pure JS).
- `clearAll` 6bis-a : `DELETE FROM archive_proof` seulement ; tables métier en 6bis-b+.
- Document ouvert via `actionViewIntent` : hors périmètre 6bis-a (6bis-d).

### Preuves CI
```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```
*(Coller sorties réelles après `npm install @op-engineering/op-sqlite@18.2.5 --save-exact`.)*


## Thread — en-tête flottant + menu ⋮ de la conversation

### Créés
- `src/features/thread/components/RoundButton.tsx` — bouton rond blanc (← et ⋮)
- `src/features/thread/components/ThreadMenu.tsx` — menu ⋮ groupé : Contact / Organisation / Zone dangereuse

### Modifiés
- `src/features/thread/components/ThreadHeader.tsx` — en-tête transparent flottant : rond ←, pilule (avatar, nom, sous-titre), rond ⋮ ; bandeau hors-ligne flottant ; `useThreadHeaderHeight`
- `src/features/thread/screens/ThreadScreen.tsx` — branche le menu (stores existants), la liste passe derrière l'en-tête
- `src/features/thread/texts.ts`, `src/shared/theme/threadMetrics.ts`

### Actions du menu ⋮ (toutes déjà existantes dans l'app)
- Voir le profil du contact
- Épingler / Désépingler (désactivé hors ligne)
- Archiver / Désarchiver (archive locale ; retour à la liste après archivage)
- Supprimer la conversation (double confirmation ; désactivé hors ligne ; retour à la liste)

### Écarts
- Pas de point vert : aucune donnée de présence dans l'app
- Sous-titre : `@username` sinon Privé / Groupe / Canal
- Pas de « Déplacer vers un dossier » : les dossiers sont calculés par type de chat, rien à déplacer

### Preuves CI
*(non exécutées — coller sorties réelles de typecheck / lint / test)*


## Botfactor — assistant de gestion du profil du bot (port du site)

### Créés
- `src/features/botfactor/` : `types`, `texts`, `commands` + `flowsProfile` / `flowsSettings`, `parseCommands`, `replies`, `engine`, `run`, `store/` (fil + lanceur), `components/`, `screens/BotfactorScreen`
- `src/shared/theme/botfactorMetrics.ts`
- `__tests__/botfactor-parse.test.ts`, `__tests__/botfactor-engine.test.ts`

### Modifiés
- `ConversationsScreen` : ligne épinglée « Botfactor » (hors recherche et hors archive)
- `BotSpaceScreen` : surcouche plein écran Botfactor (le fil ouvert dans Échanges est conservé dessous)
- `BotProfileScreen` / `InfoSection` / `botprofile/texts.ts` : bouton « Modifier avec Botfactor »

### Écarts avec le site
- Le site est en mode démonstration (« opération simulée », envoi sans attendre la réponse). L'app envoie **réellement** à Telegram, attend la réponse et affiche l'échec si Telegram refuse.
- `/setrights` appliqué pour de vrai (tout activer / tout retirer, groupes ou canaux) ; le site ne faisait rien.
- `/setmenubutton` : étapes texte + lien https ajoutées pour l'application web.
- Valeurs de flux stockées par id d'étape (le site les retrouvait par `Object.values`).
- Le bot ciblé reste local à Botfactor : `/mybots` ne change pas le bot sélectionné de l'app.
- Langue : « par défaut » uniquement.

### Preuves CI
*(non exécutées — coller sorties réelles de typecheck / lint / test)*

## 6bis-b — Schéma + migrations + lecture archive

### Durcissement 6bis-a (réserves audit)
- `ensureOpen` single-flight (promesse d'ouverture mémorisée)
- `clearAll` : ferme la connexion, `db.delete()` (fichier), `clearArchiveKey()` (Keychain)
- `open()` renvoie `{ok, reason}` si clé/base illisible (pas de crash au boot)
- `getArchiveKeyIfExists` / `clearArchiveKey` dans `secureStorage`

### Schéma (v1)
- Tables : `schema_version`, `conversations`, `messages`, `album_items`, `tombstones`
- `tombstones` = seul mécanisme de suppressions (pas de `tombstone_at` sur conversations)
- `server_deleted` : pas de colonne ; l'absence serveur ne supprime jamais (13.11). Un retrait local = ligne `tombstones` (branché en 6bis-c)
- `text` en colonne simple (FTS5 → 6bis-e)

### Migration MMKV
- Flag `archive.mmkv_migrated.v1` (idempotente)
- Sources : `conversations.page1.*`, `thread.messages.*`
- Cas « message realtime pendant migration » : upsert par id après coup (pas de perte)

### Lecture liste / fil
- `conversationsStore.load` / `threadStore.load` : archive d'abord, puis réseau, puis upsert
- Fusion par id : le serveur gagne sur les ids présents ; le local conserve le reste
- `reloadPage1` upsert aussi l'archive

### Créés
- `src/core/archive/schema.ts`, `migrations.ts`, `conversationsRepo.ts`, `messagesRepo.ts`
- `src/core/archive/migrateFromMmkv.ts`, `hydrate.ts`
- `src/features/thread/store/loadMessages.ts`
- Tests étendus `__tests__/archive-store.test.ts`

### Modifiés
- `opSqliteArchiveStore.ts`, `ArchiveStore.ts`, `registerArchiveCleaner.ts`, `index.ts`
- `secureStorage.ts`, `cache.ts` (`cacheGetAllKeys`), `storage/index.ts`
- `conversationsStore.ts`, `threadStore.ts`, `reloadPage1.ts`
- `__mocks__/op-sqlite.ts`

### Non fait (6bis-c)
- Fusion fine REST/temps réel/tombstones
- Branchement `removeMessageLocally` / `removeConversationLocally`

### Écarts
- Aucune nouvelle dépendance
- android/ inchangé

### Preuves CI
```
(à coller après exécution locale)
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```

## Correction CI 6bis-b (lint + guard op-sqlite)

### Lint
- `threadStore.ts` : suppression imports/const inutilisés (`cacheGetString`, `cacheSetString`, `sortMessagesAsc`, `threadTexts`, `cacheKey`). La lecture fil passe par `loadMessages.ts` (archive + secours MMKV). `cacheDeleteByPrefix` + `CACHE_PREFIX` conservés pour `clear()`.
- `migrateFromMmkv.ts` : suppression du `void cacheDeleteByPrefix` (code mort) ; import nettoyé.

### Guard op-sqlite
Cas retenu : **import type uniquement** hors `opSqliteArchiveStore.ts`.
| Fichier | Accès |
|---------|--------|
| `opSqliteArchiveStore.ts` | import d'exécution (`open`, `DB`) — seul autorisé |
| `conversationsRepo.ts` | `import type {DB}` |
| `messagesRepo.ts` | `import type {DB}` |
| `migrations.ts` | `import type {DB}` |
| `migrateFromMmkv.ts` | `import type {DB}` |

Le test `op-sqlite-guard.test.ts` accepte `import type … from '@op-engineering/op-sqlite'` ailleurs ; refuse tout import d'exécution hors `opSqliteArchiveStore.ts` (preuve unitaire ajoutée).

### Preuves CI
```
(à coller — environnement agent : npm registry timeout)
```
