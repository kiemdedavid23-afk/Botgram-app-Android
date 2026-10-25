# LIVRAISONS — Botgram App (cumulatif)

## L6c — Envoi de médias

### Dette section 0
- Guard R1 : détecte aussi `globalThis.fetch` / `global.fetch` / `window.fetch`
- `events.ts` découpé (`messageTypes.ts`), ≤ 300 lignes
- Pas de fichier parasite `store/&`

### Créés / modifiés L6c
- `src/features/thread/mediaLimits.ts`
- `src/features/thread/store/sendMediaActions.ts`
- `src/core/api/endpoints/messages.ts` (`sendMedia`, `sendAlbum`)
- `src/features/thread/components/ComposerBar.tsx` (Paperclip + picker)
- `src/features/thread/store/threadStore.ts` (`sendMedia`)
- `src/features/thread/texts.ts`
- `__tests__/send-media.test.ts`
- `src/core/realtime/messageTypes.ts`

### Écarts
- Progression : indicateur indéterminé (ActivityIndicator) — Worker sans progress events
- Album kinds : `photo` | `video` selon MIME (décisions)
- FormData RN `{uri,type,name}` sans second `fetch`

### Impact android/
Aucun (picker déjà présent ; blob-util déjà lié).

### Preuves CI
*(Exécuter chez le propriétaire et coller ici.)*

```
npm run typecheck
npm run lint
npm test -- --ci --coverage=false
```
