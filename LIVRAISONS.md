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
