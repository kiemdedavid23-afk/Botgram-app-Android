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
